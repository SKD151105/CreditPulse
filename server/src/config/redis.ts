import Redis from 'ioredis';
import { env } from './env';

const redisOptions: Record<string, any> = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false, // Critical for Upstash: bypass INFO command check that hangs the connection
  family: 4, // Force IPv4 to prevent resolution hangs
  tls: { rejectUnauthorized: false }, // Required for Upstash in some environments
  keepAlive: 10000, // Important for Upstash to prevent idle disconnects
};

const redis = new Redis(env.REDIS_URI, redisOptions);

redis.on('connect', () => {
  // Silent reconnects to prevent log spam from Upstash culling idle connections
});

redis.on('error', (err) => {
  console.error('Redis cache connection error:', err);
});

// BullMQ requires a separate connection config. We can just export a pre-configured ioredis instance
// with enableOfflineQueue allowed (default true) for BullMQ to handle its internal queues properly
export const redisConnection = new Redis(env.REDIS_URI, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false, // Critical for Upstash
  family: 4,
  tls: { rejectUnauthorized: false },
  keepAlive: 10000
});

export default redis;
