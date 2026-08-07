import Redis from 'ioredis';

const REDIS_URI = 'rediss://default:gQAAAAAAaUnGAAIgcDJkNWFiZGUyMjQzNzk0MzQwODVjMjQxYTExYTkxMTg1Mw@open-mole-190918.upstash.io:6379';

const redis = new Redis(REDIS_URI, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: false,
  tls: { rejectUnauthorized: false }
});

redis.on('connect', () => {
  console.log('✅ Successfully connected to Upstash Redis!');
  process.exit(0);
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
  process.exit(1);
});

console.log('Attempting to connect to Upstash...');
