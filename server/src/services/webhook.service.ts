import Webhook from '../models/Webhook';
import { webhookQueue } from '../queues/webhook.queue';
import logger from '../utils/logger';

export class WebhookService {
  static async dispatch(event: string, payload: any) {
    try {
      const webhooks = await Webhook.find({ events: event, isActive: true });

      for (const webhook of webhooks) {
        await webhookQueue.add('dispatch-webhook', {
          webhookId: webhook._id,
          event,
          payload
        });
      }
      logger.info(`Queued ${webhooks.length} webhook dispatch jobs for event ${event}`);
    } catch (error: any) {
      logger.error('Error during webhook dispatch', { error: error.message });
    }
  }
}
