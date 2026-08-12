import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.put('/profile', authenticate, UserController.updateProfile);

export default router;
