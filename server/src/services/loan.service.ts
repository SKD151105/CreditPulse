import LoanApplication from '../models/LoanApplication';
import { CacheService } from './cache.service';
import { scoringQueue } from '../config/queue';
import { emailQueue } from '../queues/email.queue';
import { WebhookService } from './webhook.service';
import User from '../models/User';
import { NotFoundError, BadRequestError, ValidationError } from '../utils/errors';
import { CACHE_TTL } from '../utils/constants';

export class LoanService {
  static async createDraft(userId: string, data: any) {
    const loan = await LoanApplication.create({
      ...data,
      applicantId: userId,
      status: 'draft',
      statusHistory: [{
        from: '',
        to: 'draft',
        changedBy: userId,
        timestamp: new Date()
      }]
    });

    await CacheService.deleteByPattern(`loans:user:${userId}:*`);
    return loan;
  }

  static async getUserLoans(userId: string, page: number, limit: number, status?: string) {
    const cacheKey = `loans:user:${userId}:p:${page}:l:${limit}:s:${status || 'all'}`;
    const cached = await CacheService.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const query: any = { applicantId: userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const [loans, total] = await Promise.all([
      LoanApplication.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LoanApplication.countDocuments(query)
    ]);

    const result = {
      loans,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };

    await CacheService.set(cacheKey, result, CACHE_TTL.LOAN_LIST);
    return result;
  }

  static async getLoanById(loanId: string, userId: string) {
    const cacheKey = `loan:${loanId}`;
    const cached = await CacheService.get<any>(cacheKey);

    if (cached) {
      if (cached.applicantId.toString() !== userId.toString()) {
         throw new NotFoundError('Loan application not found');
      }
      return cached;
    }

    const loan = await LoanApplication.findOne({ _id: loanId, applicantId: userId }).lean();
    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }

    await CacheService.set(cacheKey, loan, CACHE_TTL.LOAN);
    return loan;
  }

  static async updateDraft(loanId: string, userId: string, data: any) {
    const loan = await LoanApplication.findOne({ _id: loanId, applicantId: userId });
    
    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }

    if (loan.status !== 'draft') {
      throw new BadRequestError('Only draft applications can be modified');
    }

    Object.assign(loan, data);
    await loan.save();

    await Promise.all([
      CacheService.del(`loan:${loanId}`),
      CacheService.deleteByPattern(`loans:user:${userId}:*`)
    ]);

    return loan;
  }

  static async submitApplication(loanId: string, userId: string) {
    const loan = await LoanApplication.findOne({ _id: loanId, applicantId: userId });

    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }

    if (loan.status !== 'draft') {
      throw new BadRequestError('Only draft applications can be submitted');
    }

    const requiredFields = ['fullName', 'panNumber', 'dateOfBirth', 'phone', 'employmentType', 'monthlyIncome'];
    for (const field of requiredFields) {
      if (!(loan as any)[field]) {
        throw new ValidationError(`Missing required field: ${field}`);
      }
    }

    loan.status = 'submitted';
    loan.scoringStatus = 'pending';
    loan.scoringError = undefined;
    loan.creditScore = undefined;
    loan.riskCategory = undefined;
    loan.scoringBreakdown = undefined;
    loan.scoredAt = undefined;
    loan.statusHistory.push({
      from: 'draft',
      to: 'submitted',
      changedBy: loan.applicantId,
      timestamp: new Date()
    });

    await loan.save();

    await scoringQueue.add(
      'score-loan',
      { loanId },
      { jobId: `score-loan:${loanId}` }
    );
    
    // Dispatch Email Notification via BullMQ
    const user = await User.findById(userId).select('email name').lean();
    if (user && user.email) {
      await emailQueue.add('application_received', {
        type: 'application_received',
        email: user.email,
        name: user.name
      });
    }

    await WebhookService.dispatch('loan.submitted', {
      loanId,
      status: 'submitted',
      amount: loan.amount,
      purpose: loan.purpose
    });

    await Promise.all([
      CacheService.del(`loan:${loanId}`),
      CacheService.deleteByPattern(`loans:user:${userId}:*`)
    ]);

    return loan;
  }

  static async deleteDraft(loanId: string, userId: string) {
    const loan = await LoanApplication.findOne({ _id: loanId, applicantId: userId });

    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }

    if (loan.status !== 'draft') {
      throw new BadRequestError('Only draft applications can be withdrawn');
    }

    await loan.deleteOne();

    await Promise.all([
      CacheService.del(`loan:${loanId}`),
      CacheService.deleteByPattern(`loans:user:${userId}:*`)
    ]);
  }
}
