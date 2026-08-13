import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import User from '../models/User';
import LoanApplication from '../models/LoanApplication';
import { env } from '../config/env';
import logger from '../utils/logger';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    logger.info('--- Register Controller Started ---');
    try {
      logger.info('Calling AuthService.register...');
      const result = await AuthService.register(req.body);
      logger.info('AuthService.register completed successfully.');
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error(`Error in register controller: ${error}`);
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req: Request, res: Response, next: NextFunction) {
    logger.info('--- Google Login Controller Started ---');
    try {
      logger.info('Calling AuthService.googleLogin...');
      const result = await AuthService.googleLogin(req.body);
      logger.info('AuthService.googleLogin completed successfully.');
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error(`Error in googleLogin controller: ${error}`);
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refresh(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      await AuthService.logout(req.user._id, req.body.refreshToken);
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, data: { user: req.user } });
    } catch (error) {
      next(error);
    }
  }

  static async promote(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, secretKey } = req.body;

      if (!secretKey || secretKey !== env.SUPER_ADMIN_SECRET) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const userToPromote = await User.findOne({ email });
      if (!userToPromote) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const activeApplication = await LoanApplication.findOne({
        applicantId: userToPromote._id,
        status: { $nin: ['rejected', 'disbursed', 'draft'] }
      });

      if (activeApplication) {
        res.status(400).json({ success: false, message: 'Cannot promote a user with active loan applications' });
        return;
      }

      userToPromote.role = 'admin';
      await userToPromote.save();

      res.status(200).json({ success: true, message: 'User promoted successfully. Please log in again.' });
    } catch (error) {
      next(error);
    }
  }
}
