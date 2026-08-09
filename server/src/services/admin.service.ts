import LoanApplication from '../models/LoanApplication';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { NotificationService } from './notification.service';
import { WebhookService } from './webhook.service';
import { CacheService } from './cache.service';
import { emailQueue } from '../queues/email.queue';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';

export class AdminService {
  static async getAllLoans(adminEmail: string, page: number, limit: number, status?: string) {
    const query: any = {};
    if (status) {
      query.status = status;
    }

    if (adminEmail === 'admin@demo.com') {
      const demoUsers = await User.find({ email: /@demo\.com$/ }).select('_id');
      const demoUserIds = demoUsers.map(u => u._id);
      query.applicantId = { $in: demoUserIds };
    }

    const skip = (page - 1) * limit;

    const loans = await LoanApplication.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await LoanApplication.countDocuments(query);

    return {
      loans,
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

    await CacheService.deleteByPattern(`loan:*`);

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

    await CacheService.deleteByPattern(`loan:*`);

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

  static async getLoanAuditLogs(loanId: string) {
    const logs = await AuditLog.find({ resourceId: loanId, resource: 'loan' })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
    return logs;
  }
}
