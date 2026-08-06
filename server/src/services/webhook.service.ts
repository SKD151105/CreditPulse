import Webhook from '../models/Webhook';
import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger';

export class WebhookService {
  static async dispatch(event: string, payload: any) {
    try {
      const webhooks = await Webhook.find({ events: event, isActive: true });

      for (const webhook of webhooks) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');

        try {
          await axios.post(webhook.url, payload, {
            headers: {
              'x-creditpulse-signature': signature,
              'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 seconds timeout
          });

          // Success, reset failure count
          webhook.failureCount = 0;
          webhook.lastDeliveredAt = new Date();
          await webhook.save();
          logger.info(`Successfully dispatched webhook ${event} to ${webhook.url}`);
        } catch (error: any) {
          logger.warn(`Failed to dispatch webhook ${event} to ${webhook.url}: ${error.message}`);
          
          webhook.failureCount += 1;
          if (webhook.failureCount >= 10) {
            webhook.isActive = false;
            logger.error(`Webhook ${webhook._id} deactivated due to consecutive failures`);
          }
          await webhook.save();
        }
      }
    } catch (error) {
      logger.error('Error during webhook dispatch', error);
    }
  }
}
