import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get(
  '/stream',
  authenticate,
  NotificationController.stream
);

router.get(
  '/',
  authenticate,
  NotificationController.getHistory
);

export default router;
