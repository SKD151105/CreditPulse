import Redis from 'ioredis';
import RedisStore from 'rate-limit-redis';

const redisOptions: Record<string, any> = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  family: 4,
  keepAlive: 10000
};

const redis = new Redis("rediss://default:gQAAAAAAAUgAAIgcDJkNWFiZGUyMjQzNzk0MzQwODVjMjQxYTEyYTkxMTg1Mw@open-mole-190918.upstash.io:6379", redisOptions);

redis.on('connect', () => console.log('Connected!'));
redis.on('ready', () => console.log('Ready!'));
redis.on('error', (err) => console.log('Error!', err));

const store = new RedisStore({
  sendCommand: (...args: string[]) => redis.call(...args),
});

async function run() {
  console.log("Testing store init...");
  // Simulate express-rate-limit
  try {
    await store.increment('test_key');
    console.log("Success!");
    process.exit(0);
  } catch (e) {
    console.log("Store error:", e);
    process.exit(1);
  }
}

setTimeout(run, 1000);
