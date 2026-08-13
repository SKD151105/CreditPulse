import { Request, Response, NextFunction } from 'express';
import { redisPubSub } from '../config/redis';
import { RateLimitError } from '../utils/errors';

export const rateLimiter = (points: number, duration: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown_ip';
      const key = `rate_limit:${ip}:${req.path}`;

      const pipeline = redisPubSub.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, duration);

      const results = await pipeline.exec();

      if (!results || !results[0]) {
        return next();
      }

      const [err, currentCount] = results[0];

      if (err) {
        return next();
      }

      const count = Number(currentCount);

      if (count > points) {
        throw new RateLimitError('Too many requests, please try again later');
      }

      res.setHeader('X-RateLimit-Limit', points);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, points - count));

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        next(error);
      } else {
        next();
      }
    }
  };
};
