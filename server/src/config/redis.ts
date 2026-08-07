import Redis from 'ioredis';
import { env } from './env';

const redisOptions: Record<string, any> = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: false, // DO NOT queue commands forever if Redis fails to connect
  family: 4, // Force IPv4 to prevent resolution hangs
  tls: { rejectUnauthorized: false } // Required for Upstash in some environments
};

const redis = new Redis(env.REDIS_URI, redisOptions);

redis.on('connect', () => {
  console.log('Redis cache connected');
});

redis.on('error', (err) => {
  console.error('Redis cache connection error:', err);
});

// BullMQ requires a separate connection config. We can just export a pre-configured ioredis instance
// with enableOfflineQueue allowed (default true) for BullMQ to handle its internal queues properly
export const redisConnection = new Redis(env.REDIS_URI, {
  maxRetriesPerRequest: null,
  family: 4,
  tls: { rejectUnauthorized: false }
});

export default redis;
