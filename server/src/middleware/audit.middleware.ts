import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';

export const auditLog = (action: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    next();

    res.on('finish', async () => {
      if (res.statusCode >= 400) {
        return;
      }

      try {
        if (!req.user?._id) {
          return;
        }

        const logEntry = new AuditLog({
          userId: req.user._id,
          action,
          resource,
          resourceId: req.params.id || req.user._id,
          details: {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
          },
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        });

        await logEntry.save();
      } catch (error) {
        logger.error('Failed to create audit log entry', { error });
      }
    });
  };
};
