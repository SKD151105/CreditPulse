import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const scoringQueue = new Queue('scoring-queue', { connection: redisConnection });
export const notificationQueue = new Queue('notification-queue', { connection: redisConnection });
export const webhookQueue = new Queue('webhook-queue', { connection: redisConnection });
