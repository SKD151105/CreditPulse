import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';

export class AdminController {
  static async getAllLoans(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const result = await AdminService.getAllLoans(page, limit, status);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async assignLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const loanId = req.params.id as string;
      const adminId = req.user!._id;

      const result = await AdminService.assignLoan(loanId, adminId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateLoanStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const loanId = req.params.id as string;
      const adminId = req.user!._id;
      const { status, remarks } = req.body;

      const result = await AdminService.updateLoanStatus(loanId, adminId, status, remarks);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getLoanAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await AdminService.getLoanAuditLogs(req.params.id as string);
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}
