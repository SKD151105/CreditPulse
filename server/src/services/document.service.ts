import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import LoanApplication from '../models/LoanApplication';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import { s3Client } from '../config/s3';

export class DocumentService {
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
}
