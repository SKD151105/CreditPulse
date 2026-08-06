import Notification from '../models/Notification';
import { Response } from 'express';
import logger from '../utils/logger';
import redisClient from '../config/redis';

export class NotificationService {
  private static clients = new Map<string, Response[]>();
  
  // Create a separate Redis connection just for subscribing
  private static subscriber = redisClient.duplicate();

  static async initPubSub() {
    await this.subscriber.subscribe('notifications');
    logger.info('API Server subscribed to Redis notifications channel');

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'notifications') {
        const payload = JSON.parse(message);
        const { userId, notification } = payload;
        
        // Find if THIS specific server has the user connected
        const userClients = this.clients.get(userId.toString());
        if (userClients) {
          logger.info(`Pushing SSE event to user ${userId}`);
          userClients.forEach(res => {
            res.write(`data: ${JSON.stringify(notification)}\n\n`);
          });
        }
      }
    });
  }

  static addClient(userId: string, res: Response) {
    const userIdStr = userId.toString();
    if (!this.clients.has(userIdStr)) {
      this.clients.set(userIdStr, []);
    }
    this.clients.get(userIdStr)!.push(res);
    res.write('data: {"type":"system","message":"Connected to SSE"}\n\n');
  }

  static removeClient(userId: string, res: Response) {
    const userIdStr = userId.toString();
    const userClients = this.clients.get(userIdStr);
    if (userClients) {
      const index = userClients.indexOf(res);
      if (index !== -1) userClients.splice(index, 1);
      if (userClients.length === 0) this.clients.delete(userIdStr);
    }
  }

  static async sendNotification(userId: string, type: 'status_change' | 'score_ready' | 'assignment' | 'system', title: string, message: string, data?: any) {
    // 1. Save to MongoDB
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data
    });

    // 2. Publish to Redis (The API Server will hear this and send the SSE)
    await redisClient.publish('notifications', JSON.stringify({
      userId: userId.toString(),
      notification
    }));

    return notification;
  }
}

// Initialize immediately
NotificationService.initPubSub();
