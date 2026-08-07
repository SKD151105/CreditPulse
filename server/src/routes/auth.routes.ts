import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, googleAuthSchema, refreshTokenSchema } from '../validators/auth.schema';
import { rateLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { RATE_LIMITS } from '../utils/constants';

const router = Router();

router.post(
  '/register',
  rateLimiter(RATE_LIMITS.AUTH_REGISTER.points, RATE_LIMITS.AUTH_REGISTER.duration),
  validate(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  rateLimiter(RATE_LIMITS.AUTH_LOGIN.points, RATE_LIMITS.AUTH_LOGIN.duration),
  validate(loginSchema),
  AuthController.login
);

router.post(
  '/google',
  rateLimiter(RATE_LIMITS.AUTH_LOGIN.points, RATE_LIMITS.AUTH_LOGIN.duration),
  validate(googleAuthSchema),
  AuthController.googleLogin
);

router.post(
  '/refresh',
  rateLimiter(20, 60),
  validate(refreshTokenSchema),
  AuthController.refresh
);

router.post(
  '/logout',
  authenticate,
  validate(refreshTokenSchema),
  AuthController.logout
);

router.get(
  '/me',
  authenticate,
  AuthController.getMe
);

router.post('/promote', AuthController.promote);

export default router;
