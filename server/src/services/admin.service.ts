import LoanApplication from '../models/LoanApplication';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { NotificationService } from './notification.service';
import { WebhookService } from './webhook.service';
import { CacheService } from './cache.service';
import { emailQueue } from '../queues/email.queue';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';
import { scoringQueue } from '../config/queue';

export class AdminService {
  static async getAllLoans(adminEmail: string, page: number, limit: number, status?: string) {
    const demoUsers = await User.find({ email: /@demo\.com$/ }).select('_id');
    const demoUserIds = demoUsers.map(u => u._id);

    const baseQuery: any = { status: { $ne: 'draft' } };
    if (adminEmail === 'admin@demo.com') {
      baseQuery.applicantId = { $in: demoUserIds };
    } else {
      baseQuery.applicantId = { $nin: demoUserIds };
    }

    const query = { ...baseQuery };
    if (status) {
      if (status === 'pending') {
        query.status = { $in: ['submitted', 'under_review'] };
      } else {
        query.status = status;
      }
    }

    const skip = (page - 1) * limit;

    const [loans, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      LoanApplication.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LoanApplication.countDocuments(query),
      LoanApplication.countDocuments({ ...baseQuery, status: { $in: ['submitted', 'under_review'] } }),
      LoanApplication.countDocuments({ ...baseQuery, status: 'approved' }),
      LoanApplication.countDocuments({ ...baseQuery, status: 'rejected' })
    ]);

    return {
      loans,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      },
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async assignLoan(loanId: string, adminId: string) {
    const loan = await LoanApplication.findById(loanId);
    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }

    if (loan.status !== 'submitted') {
      throw new BadRequestError('Can only assign submitted loans');
    }

    loan.assignedTo = adminId as any;
    loan.status = 'under_review';
    loan.statusHistory.push({
      from: 'submitted',
      to: 'under_review',
      changedBy: adminId as any,
      timestamp: new Date()
    });

    await loan.save();

    await Promise.all([
      CacheService.deleteByPattern(`loan:*`),
      CacheService.deleteByPattern(`loans:user:${loan.applicantId}:*`)
    ]);

    // Create a separate audit log for the under_review status change
    // so the Activity Timeline shows it as its own step
    await AuditLog.create({
      userId: adminId,
      action: 'UPDATE_LOAN_STATUS',
      resource: 'loan',
      resourceId: loanId,
      details: { method: 'PATCH', url: `/admin/loans/${loanId}/assign`, statusCode: 200, body: { status: 'under_review' } },
      ipAddress: 'system',
      userAgent: 'system',
    });

    await NotificationService.sendNotification(
      loan.applicantId.toString(),
      'status_change',
      'Loan Under Review',
      'An admin is reviewing your loan.'
    );

    logger.info(`Loan ${loanId} assigned to admin ${adminId}`);

    return loan;
  }

  static async updateLoanStatus(loanId: string, adminId: string, status: 'approved' | 'rejected', remarks: string) {
    const loan = await LoanApplication.findById(loanId);
    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }

    if (loan.status !== 'under_review') {
      throw new BadRequestError('Can only update status of loans under review');
    }

    loan.status = status;
    loan.reviewRemarks = remarks;
    if (status === 'approved') {
      loan.approvedAmount = loan.amount;
    }

    loan.statusHistory.push({
      from: 'under_review',
      to: status,
      changedBy: adminId as any,
      timestamp: new Date()
    });

    await loan.save();

    await Promise.all([
      CacheService.deleteByPattern(`loan:*`),
      CacheService.deleteByPattern(`loans:user:${loan.applicantId}:*`)
    ]);

    await NotificationService.sendNotification(
      loan.applicantId.toString(),
      'status_change',
      'Decision Reached',
      `Your loan was ${status}`
    );

    await WebhookService.dispatch(`loan.${status}`, {
      loanId,
      status,
      approvedAmount: loan.approvedAmount,
      remarks
    });

    // Dispatch Email Notification via BullMQ
    const user = await User.findById(loan.applicantId).select('email name').lean();
    if (user && user.email) {
      await emailQueue.add('application_decision', {
        type: 'application_decision',
        email: user.email,
        name: user.name,
        status,
        amount: loan.approvedAmount
      });
    }

    logger.info(`Loan ${loanId} marked as ${status} by admin ${adminId}`);

    return loan;
  }

  static async retryScoring(loanId: string, adminId: string) {
    // Atomic update ensures that double-clicks/refresh storms won't enqueue multiple jobs
    const loan = await LoanApplication.findOneAndUpdate(
      { _id: loanId, scoringStatus: 'failed' },
      {
        $set: { scoringStatus: 'pending' },
        $unset: {
          scoringError: 1,
          creditScore: 1,
          riskCategory: 1,
          scoringBreakdown: 1,
          scoredAt: 1
        }
      },
      { new: true }
    );

    if (!loan) {
      // Fetch to give the correct contextual error
      const existing = await LoanApplication.findById(loanId);
      if (!existing) {
        throw new NotFoundError('Loan application not found');
      }
      if (existing.status === 'draft') {
        throw new BadRequestError('Draft applications cannot be scored');
      }
      if (existing.scoringStatus !== 'failed') {
        throw new BadRequestError('Scoring can only be retried after a failed attempt');
      }
      throw new BadRequestError('Unable to retry scoring at this time');
    }

    await scoringQueue.add(
      'score-loan',
      { loanId, forceRetry: true },
      { jobId: `score-loan:retry:${loanId}:${Date.now()}` }
    );

    await Promise.all([
      CacheService.del(`loan:${loanId}`),
      CacheService.deleteByPattern(`loans:user:${loan.applicantId}:*`)
    ]);

    logger.info(`Scoring retry queued for loan ${loanId} by admin ${adminId}`);

    return loan;
  }

  static async getLoanAuditLogs(loanId: string) {
    const logs = await AuditLog.find({ resourceId: loanId, resource: 'loan' })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
    return logs;
  }
}
