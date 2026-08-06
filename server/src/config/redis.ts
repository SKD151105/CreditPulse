import Redis from 'ioredis';
import { env } from './env';

const isTls = env.REDIS_URI.startsWith('rediss://');

const redisOptions: Record<string, any> = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

if (isTls) {
  redisOptions.tls = {};
}

const redis = new Redis(env.REDIS_URI, redisOptions);

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

const parsedUrl = new URL(env.REDIS_URI);

export const redisConnection = {
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port || '6379', 10),
  password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
  username: parsedUrl.username ? decodeURIComponent(parsedUrl.username) : undefined,
  ...(isTls ? { tls: {} } : {}),
};

export default redis;
