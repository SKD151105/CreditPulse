import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';

export class DocumentController {
  static async generateUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const loanId = req.params.loanId as string;
      const userId = req.user!._id;
      const { fileName, fileType, docType } = req.body;
      
      const result = await DocumentService.generateUploadUrl(loanId, userId, fileName, fileType, docType);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async confirmUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const loanId = req.params.loanId as string;
      const userId = req.user!._id;
      const { s3Key, originalName, mimeType, size, docType } = req.body;
      
      const result = await DocumentService.confirmUpload(loanId, userId, s3Key, originalName, mimeType, size, docType);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async generateDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const loanId = req.params.loanId as string;
      const docId = req.params.docId as string;
      const userId = req.user!._id;
      const role = req.user!.role;
      
      const result = await DocumentService.generateDownloadUrl(loanId, userId, docId, role);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const loanId = req.params.loanId as string;
      const docId = req.params.docId as string;
      const userId = req.user!._id;
      
      await DocumentService.deleteDocument(loanId, userId, docId);
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      next(error);
    }
  }
}
