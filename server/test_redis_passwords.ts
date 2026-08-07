import { Redis } from 'ioredis';

const testRedis = async (uri: string, name: string) => {
  console.log(`Testing ${name}...`);
  const redis = new Redis(uri, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    family: 4,
    keepAlive: 10000,
    tls: { rejectUnauthorized: false },
    enableOfflineQueue: false
  });

  try {
    const res = await redis.ping();
    console.log(`[SUCCESS] ${name} connected! Ping response: ${res}`);
  } catch (err: any) {
    console.error(`[FAILED] ${name} failed:`, err.message);
  } finally {
    redis.quit();
  }
};

const run = async () => {
  const uri1 = 'rediss://default:gQAAAAAAAUgAAIgcDJkNWFiZGUyMjQzNzk0MzQwODVjMjQxYTEyYTkxMTg1Mw@upward-dinosaur-39240.upstash.io:39240';
  const uri2 = 'rediss://default:gQAAAAAAaUnGAAIgcDJkNWFiZGUyMjQzNzk0MzQwODVjMjQxYTExYTkxMTg1Mw@upward-dinosaur-39240.upstash.io:39240';
  
  await testRedis(uri1, 'URI 1 (from .env)');
  await testRedis(uri2, 'URI 2 (from deleted test file)');
  process.exit(0);
};

run();
