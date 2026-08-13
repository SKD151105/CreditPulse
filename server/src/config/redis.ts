import Redis from 'ioredis';
import { env } from './env';

// Standard Redis Configuration for caching and rate limiting
const redis = new Redis(env.REDIS_URI, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false // Fail fast for cache operations if Redis goes down
});

redis.on('error', (err) => {
  console.error('Redis cache connection error:', err);
});

// Dedicated Redis Connection for BullMQ
// BullMQ requires maxRetriesPerRequest: null and needs offline queues to remain enabled (default true)
export const redisConnection = new Redis(env.REDIS_URI, {
  maxRetriesPerRequest: null
});

export default redis;
