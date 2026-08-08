import { Worker, Job } from 'bullmq';
import redis from '../config/redis';
import logger from '../utils/logger';
import { EmailService } from '../services/email.service';

export const emailWorker = new Worker(
  'email-queue',
  async (job: Job) => {
    logger.info(`Processing email job ${job.id} of type ${job.name}`);
    
    const { type, email, name, status, amount } = job.data;
    
    try {
      if (type === 'application_received') {
        await EmailService.sendApplicationReceived(email, name);
      } else if (type === 'application_decision') {
        await EmailService.sendApplicationDecision(email, name, status, amount);
      }
      
      logger.info(`Successfully processed email job ${job.id}`);
    } catch (error: any) {
      logger.error(`Failed to process email job ${job.id}`, { error: error.message });
      throw error;
    }
  },
  { connection: redis }
);

emailWorker.on('failed', (job, err) => {
  logger.error(`Email Job ${job?.id} failed with error ${err.message}`);
});
