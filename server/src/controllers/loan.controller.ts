import { Request, Response, NextFunction } from 'express';
import { LoanService } from '../services/loan.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { env } from '../config/env';
import AuditLog from '../models/AuditLog';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export class LoanController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LoanService.createDraft(req.user!._id, req.body);
      // Manually create the audit log here because the generic middleware
      // runs on POST / where req.params.id is undefined, causing wrong resourceId
      await new AuditLog({
        userId: req.user!._id,
        action: 'CREATE_LOAN',
        resource: 'loan',
        resourceId: result._id,
        details: { method: 'POST', url: req.url, statusCode: 201 },
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      }).save();
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status } = req.query as any; 
      const result = await LoanService.getUserLoans(
        req.user!._id,
        Number(page),
        Number(limit),
        status as string
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LoanService.getLoanById(req.params.id as string, req.user!._id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LoanService.updateDraft(req.params.id as string, req.user!._id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LoanService.submitApplication(req.params.id as string, req.user!._id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await LoanService.deleteDraft(req.params.id as string, req.user!._id);
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      next(error);
    }
  }

  static async getUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename, fileType } = req.query;
      const userId = req.user!._id.toString();

      if (!filename || !fileType) {
        res.status(400).json({ success: false, message: 'filename and fileType are required' });
        return;
      }

      const extension = (filename as string).split('.').pop() || '';
      const s3Key = `uploads/${userId}/${crypto.randomUUID()}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: s3Key,
        ContentType: fileType as string,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
      const fileUrl = `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${s3Key}`;

      res.status(200).json({ success: true, data: { presignedUrl, fileUrl, s3Key } });
    } catch (error) {
      next(error);
    }
  }
}
