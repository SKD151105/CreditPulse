import { Queue } from 'bullmq';
import { createRedisConnection } from './redis';

// Each Queue gets its OWN dedicated ioredis connection.
// Sharing a single connection between Queues (and with Workers) causes
// silent BullMQ job delivery failures.
export const scoringQueue = new Queue('scoring-queue', { connection: createRedisConnection() });
export const notificationQueue = new Queue('notification-queue', { connection: createRedisConnection() });
export const webhookQueue = new Queue('webhook-queue', { connection: createRedisConnection() });
