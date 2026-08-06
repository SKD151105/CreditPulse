import mongoose from 'mongoose';
import { connectDB } from './config/db';
import User from './models/User';
import { hashPassword } from './utils/password';
import logger from './utils/logger';

const seed = async () => {
  await connectDB();

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    logger.info('Admin already exists, skipping seed');
    await mongoose.disconnect();
    process.exit(0);
  }

  const hashedPassword = await hashPassword('Admin@123');
  await User.create({
    name: 'Super Admin',
    email: 'admin@creditpulse.com',
    password: hashedPassword,
    role: 'admin',
    isActive: true,
  });

  logger.info('Admin user created: admin@creditpulse.com / Admin@123');
  logger.info('IMPORTANT: Change this password immediately in production!');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  logger.error('Seed failed', { error: err.message });
  process.exit(1);
});
