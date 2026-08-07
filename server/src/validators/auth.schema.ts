import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string(),
  adminOnly: z.boolean().optional(),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Credential is required'),
  adminOnly: z.boolean().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const promoteSchema = z.object({
  email: z.string().email('Invalid email format'),
  secretKey: z.string().min(1, 'Secret key is required'),
});
