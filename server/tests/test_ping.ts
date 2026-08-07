import Redis from 'ioredis';

const uri = "rediss://default:gQAAAAAAAUgAAIgcDJkNWFiZGUyMjQzNzk0MzQwODVjMjQxYTEyYTkxMTg1Mw@open-mole-190918.upstash.io:6379";

async function run() {
  console.log("Connecting to Redis...");
  const redis = new Redis(uri);
  
  redis.on('error', (err) => console.log('Redis Error:', err.message));
  redis.on('connect', () => console.log('Redis connected event'));
  redis.on('ready', () => console.log('Redis ready event'));
  
  try {
    const res = await redis.ping();
    console.log("PING response:", res);
    process.exit(0);
  } catch (err) {
    console.error("Ping failed:", err);
    process.exit(1);
  }
}

run();
