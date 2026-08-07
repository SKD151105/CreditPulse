import mongoose from 'mongoose';
import { env } from './env';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, { 
      family: 4,
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected');
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB Error:', error);
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});
