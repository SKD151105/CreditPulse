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
redis.on('error', (err) => console.log('Error!', err));

const store = new RedisStore({
  sendCommand: (...args: string[]) => redis.call(...args),
});
console.log("redis.call is:", typeof redis.call);
