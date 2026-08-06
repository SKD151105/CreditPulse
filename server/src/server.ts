import mongoose from 'mongoose';
import app from './app';
import { connectDB } from './config/db';
import redis from './config/redis';
import logger from './utils/logger';
import { env } from './config/env';

const startServer = async () => {
  await connectDB();
  logger.info('Redis client initialized');

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected.');
        await redis.quit();
        logger.info('Redis client quit.');
        process.exit(0);
      } catch (err: any) {
        logger.error('Error during graceful shutdown', { error: err.message });
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
