import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { env } from '../config/env';
import LoanApplication from '../models/LoanApplication';
import { CacheService } from './cache.service';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export class DocumentService {
  static async generateUploadUrl(loanId: string, userId: string, fileName: string, fileType: string, docType: string) {
    const loan = await LoanApplication.findById(loanId);
    
    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }
    if (loan.applicantId.toString() !== userId.toString()) {
      throw new UnauthorizedError('Not authorized to access this loan');
    }
    if (loan.status !== 'draft') {
      throw new BadRequestError('Can only upload documents to a draft application');
    }

    const extension = fileName.split('.').pop() || '';
    const s3Key = `loans/${loanId}/${docType}_${crypto.randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 mins

    return { uploadUrl, s3Key };
  }

  static async confirmUpload(loanId: string, userId: string, s3Key: string, originalName: string, mimeType: string, size: number, docType: string) {
    const loan = await LoanApplication.findById(loanId);

    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }
    if (loan.applicantId.toString() !== userId.toString()) {
      throw new UnauthorizedError('Not authorized to access this loan');
    }
    if (loan.status !== 'draft') {
      throw new BadRequestError('Can only add documents to a draft application');
    }

    loan.documents.push({
      type: docType as any,
      s3Key,
      originalName,
      mimeType,
      size,
      uploadedAt: new Date(),
    } as any);

    await loan.save();

    await CacheService.del(`loan:${loanId}`);
    await CacheService.deleteByPattern(`loans:user:${userId}:*`);

    return loan;
  }

  static async generateDownloadUrl(loanId: string, userId: string, docId: string, role: string) {
    const loan = await LoanApplication.findById(loanId);

    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }
    
    if (role !== 'admin' && loan.applicantId.toString() !== userId.toString()) {
      throw new UnauthorizedError('Not authorized to access this document');
    }

    const doc = loan.documents.find(d => d._id.toString() === docId); 
    
    if (!doc) {
      throw new NotFoundError('Document not found in this loan application');
    }

    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: doc.s3Key,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 mins

    return { downloadUrl, originalName: doc.originalName };
  }

  static async deleteDocument(loanId: string, userId: string, docId: string) {
    const loan = await LoanApplication.findById(loanId);

    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }
    if (loan.applicantId.toString() !== userId.toString()) {
      throw new UnauthorizedError('Not authorized to access this loan');
    }
    if (loan.status !== 'draft') {
      throw new BadRequestError('Can only delete documents from a draft application');
    }

    const docIndex = loan.documents.findIndex(d => d._id.toString() === docId);
    
    if (docIndex === -1) {
      throw new NotFoundError('Document not found in this loan application');
    }

    const doc = loan.documents[docIndex];
    loan.documents.splice(docIndex, 1);

    await loan.save();

    const command = new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: doc.s3Key,
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      // Continue even if S3 delete fails so DB remains consistent, just log it
      logger.error('Failed to delete S3 object', { error });
    }

    await CacheService.del(`loan:${loanId}`);
    await CacheService.deleteByPattern(`loans:user:${userId}:*`);
  }
}
