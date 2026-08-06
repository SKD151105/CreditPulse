import { Request, Response, NextFunction } from 'express';
import { LoanService } from '../services/loan.service';

export class LoanController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LoanService.createDraft(req.user!._id, req.body);
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
}
