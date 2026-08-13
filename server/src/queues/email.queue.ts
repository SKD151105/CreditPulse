import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import logger from '../utils/logger';

export const emailQueue = new Queue('email-queue', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

logger.info('Email queue initialized');
