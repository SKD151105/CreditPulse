import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';

export class DocumentController {
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
}
