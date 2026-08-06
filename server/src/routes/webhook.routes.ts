import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('admin'));
router.post('/', WebhookController.register);
router.get('/', WebhookController.list);
router.patch('/:id/toggle', WebhookController.toggleStatus);

export default router;
