import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { ScoringService } from '../services/scoring.service';
import { NotificationService } from '../services/notification.service';
import { WebhookService } from '../services/webhook.service';
import { CacheService } from '../services/cache.service';
import logger from '../utils/logger';
import LoanApplication from '../models/LoanApplication';

export const scoringWorker = new Worker(
  'scoring-queue',
  async (job: Job) => {
    const { loanId, forceRetry = false } = job.data;
    logger.info(`Processing scoring job ${job.id} for loan ${loanId} (forceRetry=${forceRetry})`);
    
    try {
      const existingLoan = await LoanApplication.findById(loanId);

      if (!existingLoan) {
        throw new Error(`Loan ${loanId} not found`);
      }

      if (
        existingLoan.scoringStatus === 'completed' &&
        typeof existingLoan.creditScore === 'number' &&
        existingLoan.scoredAt &&
        !forceRetry
      ) {
        logger.info(`Skipping scoring for loan ${loanId}; score already completed`);
        return existingLoan;
      }

      if (
        existingLoan.scoringStatus === 'pending' &&
        !forceRetry
      ) {
        logger.info(`Skipping scoring for loan ${loanId}; score job already in flight`);
        return existingLoan;
      }

      // Run the scoring engine
      const loan = await ScoringService.calculateScore(loanId);

      await Promise.all([
        CacheService.del(`loan:${loanId}`),
        CacheService.deleteByPattern(`loans:user:${loan.applicantId}:*`)
      ]);
      
      logger.info(`Successfully scored loan ${loanId}. Score: ${loan.creditScore}`);
      
      await NotificationService.sendNotification(
        loan.applicantId.toString(),
        'score_ready',
        'Score Calculated!',
        'Your loan application score has been generated',
        { loanId: loan._id as any, creditScore: loan.creditScore }
      );

      await WebhookService.dispatch('loan.scored', {
        loanId: loan._id,
        creditScore: loan.creditScore,
        status: loan.status
      });
      
      return loan;
    } catch (error) {
      logger.error(`Error processing loan ${loanId}: ${error}`);
      
      // Keep the loan in "submitted" so an admin can still claim it manually.
      // Moving it to "under_review" without an assignee leaves it stranded.
      const failedLoan = await LoanApplication.findById(loanId);

      if (failedLoan) {
        failedLoan.scoringStatus = 'failed';
        failedLoan.scoringError = error instanceof Error ? error.message : 'Scoring failed unexpectedly';
        failedLoan.creditScore = undefined;
        failedLoan.riskCategory = undefined;
        failedLoan.scoringBreakdown = undefined;
        failedLoan.scoredAt = undefined;
        await failedLoan.save();

        await Promise.all([
          CacheService.del(`loan:${loanId}`),
          CacheService.deleteByPattern(`loans:user:${failedLoan.applicantId}:*`)
        ]);

        await NotificationService.sendNotification(
          failedLoan.applicantId.toString(),
          'score_failed',
          'Scoring Delayed',
          'Your loan application could not be scored automatically and is awaiting review.',
          { loanId }
        );
      }
      
      throw error;
    }
  },
  { 
    connection: createRedisConnection(),
    concurrency: 5, // Process 5 loans concurrently
    limiter: {
      max: 10, // Max 10 jobs per second
      duration: 1000
    }
  }
);

scoringWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

scoringWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err.message}`);
});
