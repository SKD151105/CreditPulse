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

/**
 * Factory function: creates a fresh ioredis connection for BullMQ.
 * BullMQ requires each Queue AND Worker to have their OWN dedicated
 * ioredis instance — sharing a single connection causes silent job
 * delivery failures.
 */
export const createRedisConnection = () =>
  new Redis(env.REDIS_URI, { maxRetriesPerRequest: null });

// Dedicated singleton for BullMQ (legacy — prefer createRedisConnection() for new usages)
export const redisConnection = createRedisConnection();

// Dedicated Redis Connection for Pub/Sub (SSE notifications)
// Must NOT have enableOfflineQueue: false — pub/sub streams need it enabled to initialize
export const redisPubSub = new Redis(env.REDIS_URI, {
  maxRetriesPerRequest: null
});

export default redis;
