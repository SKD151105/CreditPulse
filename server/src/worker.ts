import { connectDB } from './config/db';
import logger from './utils/logger';
import { scoringWorker } from './workers/scoring.worker';
import { emailWorker } from './workers/email.worker';
import { webhookWorker } from './workers/webhook.worker';
import mongoose from 'mongoose';
import redis from './config/redis';

async function startWorker() {
  logger.info('Starting worker process...');
  await connectDB();
  logger.info('Worker connected to database');
  
  // The workers are imported and automatically start listening
  logger.info('Scoring worker is listening for jobs on "scoring-queue"');
  logger.info('Email worker is listening for jobs on "email-queue"');
  logger.info('Webhook worker is listening for jobs on "webhook-queue"');
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down worker gracefully...`);
  await scoringWorker.close();
  await emailWorker.close();
  await webhookWorker.close();
  await mongoose.disconnect();
  redis.quit();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startWorker().catch((err) => {
  logger.error('Failed to start worker', { error: err.message });
  process.exit(1);
});
