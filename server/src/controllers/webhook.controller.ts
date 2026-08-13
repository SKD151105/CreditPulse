import { Request, Response, NextFunction } from 'express';
import Webhook from '../models/Webhook';
import crypto from 'crypto';

export class WebhookController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { url, events } = req.body;
      const userId = req.user!._id;

      const secret = crypto.randomBytes(32).toString('hex');

      const webhook = await Webhook.create({
        userId,
        url,
        events,
        secret
      });

      res.status(201).json({ success: true, data: webhook });
    } catch (error) {
      next(error);
    }
  }

  static async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const webhooks = await Webhook.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: webhooks });
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const webhookId = req.params.id;
      
      const webhook = await Webhook.findById(webhookId);
      if (!webhook) {
        return res.status(404).json({ success: false, message: 'Webhook not found' });
      }

      webhook.isActive = !webhook.isActive;
      await webhook.save();

      res.status(200).json({ success: true, data: webhook });
    } catch (error) {
      next(error);
    }
  }
}
