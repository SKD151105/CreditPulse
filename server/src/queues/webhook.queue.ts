import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import logger from '../utils/logger';

export const webhookQueue = new Queue('webhook-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s, 16s, 32s...
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

logger.info('Webhook queue initialized');
