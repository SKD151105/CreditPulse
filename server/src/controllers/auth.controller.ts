import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import User from '../models/User';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
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
    try {
      const result = await AuthService.googleLogin(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
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

      if (!secretKey || secretKey !== process.env.SUPER_ADMIN_SECRET) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      await User.findOneAndUpdate(
        { email },
        { role: 'admin' }
      );

      res.status(200).json({ success: true, message: 'User promoted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
