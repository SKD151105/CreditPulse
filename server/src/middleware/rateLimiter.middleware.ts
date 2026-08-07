import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import { RateLimitError } from '../utils/errors';

export const rateLimiter = (points: number, duration: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log(`--- rateLimiter (custom) started for ${req.path} ---`);
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown_ip';
      const key = `rate_limit:${ip}:${req.path}`;
      console.log(`rateLimiter: executing redis pipeline for ${key}...`);

      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, duration);

      const results = await pipeline.exec();
      console.log(`rateLimiter: redis pipeline finished for ${key}`);

      if (!results || !results[0]) {
        console.log(`rateLimiter: no results, calling next()`);
        return next();
      }

      const [err, currentCount] = results[0];

      if (err) {
        console.error('Redis rate limiter error:', err);
        return next();
      }

      const count = Number(currentCount);

      if (count > points) {
        throw new RateLimitError('Too many requests, please try again later');
      }

      res.setHeader('X-RateLimit-Limit', points);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, points - count));

      console.log(`rateLimiter: success, calling next()`);
      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        next(error);
      } else {
        console.error('Rate limiter execution error:', error);
        next();
      }
    }
  };
};
