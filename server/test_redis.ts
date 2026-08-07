import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from './src/config/env';

const uri = "rediss://default:gQAAAAAAAUgAAIgcDJkNWFiZGUyMjQzNzk0MzQwODVjMjQxYTEyYTkxMTg1Mw@open-mole-190918.upstash.io:6379";

console.log("Testing BullMQ connection with URI...");

// BullMQ REQUIRES maxRetriesPerRequest: null
const connection = new Redis(uri, { maxRetriesPerRequest: null });
connection.on('error', (err) => console.log("Redis connection error:", err.message));
connection.on('connect', () => console.log("Redis connected!"));

const testQueue = new Queue('test', { connection });

async function run() {
  try {
    console.log("Adding job to BullMQ...");
    await testQueue.add('testJob', { foo: 'bar' });
    console.log("Job added successfully!");
    
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

run();
