import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import Notification from '../models/Notification';

export class NotificationController {
  static stream(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    res.flushHeaders();

    const userId = req.user!._id;
    NotificationService.addClient(userId, res);

    req.on('close', () => {
      NotificationService.removeClient(userId, res);
    });
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!._id;
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
        
      res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }
}
