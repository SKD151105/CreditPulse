import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import User, { IUser } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/password';
import logger from '../utils/logger';
import { AppError, UnauthorizedError, ConflictError } from '../utils/errors';
import { env } from '../config/env';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export class AuthService {
  static async register({ name, email, password }: any) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    const hashedPassword = await hashPassword(password);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'applicant',
    });

    const accessToken = generateAccessToken({ _id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ _id: user._id });

    const hashedRefreshToken = hashToken(refreshToken);
    user.refreshTokens.push(hashedRefreshToken);
    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as Partial<IUser>).password;
    delete (userResponse as Partial<IUser>).refreshTokens;

    return { user: userResponse, accessToken, refreshToken };
  }

  static async login({ email, password, adminOnly }: any) {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (adminOnly && user.role !== 'admin') {
      throw new UnauthorizedError('Access Denied: Admins only');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const accessToken = generateAccessToken({ _id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ _id: user._id });

    const hashedRefreshToken = hashToken(refreshToken);
    user.refreshTokens.push(hashedRefreshToken);
    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as Partial<IUser>).password;
    delete (userResponse as Partial<IUser>).refreshTokens;

    return { user: userResponse, accessToken, refreshToken };
  }

  static async googleLogin({ credential, adminOnly }: any) {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.name || !payload.sub) {
      throw new UnauthorizedError('Invalid Google token');
    }

    const { email, name, sub: googleId } = payload;
    let user = await User.findOne({ email });

    if (adminOnly) {
      if (!user || user.role !== 'admin') {
        throw new UnauthorizedError('Access Denied: Admins only');
      }
      if (!user.googleId) {
        user.googleId = googleId;
      }
    } else {
      if (user) {
        if (!user.googleId) {
          user.googleId = googleId;
        }
      } else {
        user = await User.create({
          email,
          name,
          googleId,
          role: 'applicant',
        });
      }
    }

    const accessToken = generateAccessToken({ _id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ _id: user._id });

    const hashedRefreshToken = hashToken(refreshToken);
    user.refreshTokens.push(hashedRefreshToken);
    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as Partial<IUser>).password;
    delete (userResponse as Partial<IUser>).refreshTokens;

    return { user: userResponse, accessToken, refreshToken };
  }

  static async refresh({ refreshToken }: any) {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const hashedToken = hashToken(refreshToken);
    const tokenIndex = user.refreshTokens.indexOf(hashedToken);

    if (tokenIndex === -1) {
      // Token reuse detected - clear all tokens
      user.refreshTokens = [];
      await user.save();
      logger.warn(`Token reuse detected for user ${user._id}`);
      throw new UnauthorizedError('Invalid refresh token');
    }

    user.refreshTokens.splice(tokenIndex, 1);

    const accessToken = generateAccessToken({ _id: user._id, email: user.email, role: user.role, name: user.name });
    const newRefreshToken = generateRefreshToken({ _id: user._id });

    const newHashedToken = hashToken(newRefreshToken);
    user.refreshTokens.push(newHashedToken);
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async logout(userId: string, refreshToken: string) {
    const user = await User.findById(userId);
    if (!user) return;

    const hashedToken = hashToken(refreshToken);
    user.refreshTokens = user.refreshTokens.filter(token => token !== hashedToken);
    await user.save();
  }
}
