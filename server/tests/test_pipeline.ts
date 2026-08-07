import Redis from 'ioredis';

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  family: 4,
  keepAlive: 10000
};

const redis = new Redis("rediss://default:gQAAAAAAAUgAAIgcDJkNWFiZGUyMjQzNzk0MzQwODVjMjQxYTEyYTkxMTg1Mw@open-mole-190918.upstash.io:6379", redisOptions);

async function run() {
  console.log("Status:", redis.status);
  try {
    const pipeline = redis.pipeline();
    pipeline.incr('test_key');
    pipeline.expire('test_key', 60);
    console.log("Exec...");
    const res = await pipeline.exec();
    console.log("Success:", res);
    process.exit(0);
  } catch (e) {
    console.log("Error:", e);
    process.exit(1);
  }
}

setTimeout(run, 1000);
