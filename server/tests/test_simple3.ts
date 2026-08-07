import Redis from 'ioredis';

const redis = new Redis("rediss://default:gQAAAAAAAUgAAIgcDJkNWFiZGUyMjQzNzk0MzQwODVjMjQxYTEyYTkxMTg1Mw@open-mole-190918.upstash.io:6379", {
  enableReadyCheck: false
});

redis.on('connect', () => console.log('Connected!'));
redis.on('ready', () => {
  console.log('Ready!');
  process.exit(0);
});
redis.on('error', (err) => console.log('Error!', err));

setTimeout(() => {
  console.log("Timeout!");
  process.exit(1);
}, 5000);
