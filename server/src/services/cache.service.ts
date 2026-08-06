import redis from '../config/redis';
import logger from '../utils/logger';

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Cache del error for key ${key}:`, error);
    }
  }

  static async deleteByPattern(pattern: string): Promise<void> {
    try {
      let deletedCount = 0;
      const stream = redis.scanStream({ match: pattern });

      await new Promise<void>((resolve, reject) => {
        stream.on('data', async (keys: string[]) => {
          if (keys.length) {
            stream.pause();
            const pipeline = redis.pipeline();
            keys.forEach(key => pipeline.del(key));
            await pipeline.exec();
            deletedCount += keys.length;
            stream.resume();
          }
        });
        stream.on('end', () => resolve());
        stream.on('error', (err) => reject(err));
      });

      if (deletedCount > 0) {
        logger.info(`Deleted ${deletedCount} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache deleteByPattern error for pattern ${pattern}:`, error);
    }
  }
}
