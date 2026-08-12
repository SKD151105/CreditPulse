import { Request, Response } from 'express';
import User from '../models/User';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export class UserController {
  static async updateProfile(req: Request, res: Response) {
    try {
      const { name, username, bio, avatar } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // Check if username is taken by another user
      if (username) {
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Username is already taken',
          });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            ...(name && { name }),
            ...(username !== undefined && { username }),
            ...(bio !== undefined && { bio }),
            ...(avatar !== undefined && { avatar }),
          },
        },
        { new: true }
      ).select('-password -refreshTokens');

      if (!updatedUser) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    }
  }
}
