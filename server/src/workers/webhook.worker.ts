import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import logger from '../utils/logger';
import Webhook from '../models/Webhook';
import axios from 'axios';
import crypto from 'crypto';

export const webhookWorker = new Worker(
  'webhook-queue',
  async (job: Job) => {
    logger.info(`Processing webhook job ${job.id}`);
    
    const { webhookId, event, payload } = job.data;
    
    const webhook = await Webhook.findById(webhookId);
    if (!webhook || !webhook.isActive) {
      logger.info(`Webhook ${webhookId} is no longer active or was deleted, skipping job ${job.id}`);
      return;
    }
    
    try {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      await axios.post(webhook.url, payload, {
        headers: {
          'x-creditpulse-signature': signature,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      // Success, reset failure count
      webhook.failureCount = 0;
      webhook.lastDeliveredAt = new Date();
      await webhook.save();
      logger.info(`Successfully dispatched webhook ${event} to ${webhook.url}`);
    } catch (error: any) {
      logger.warn(`Failed to dispatch webhook ${event} to ${webhook.url}: ${error.message}`);
      
      webhook.failureCount += 1;
      if (webhook.failureCount >= 10) {
        webhook.isActive = false;
        logger.error(`Webhook ${webhook._id} deactivated due to 10 consecutive failures`);
      }
      await webhook.save();
      
      throw error; // Throw so BullMQ retries
    }
  },
  { connection: redisConnection }
);

webhookWorker.on('failed', (job, err) => {
  logger.error(`Webhook Job ${job?.id} failed with error ${err.message}`);
});
