import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { createDraftSchema, updateDraftSchema, loanQuerySchema } from '../validators/loan.schema';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();

router.get(
  '/upload-url',
  authenticate,
  LoanController.getUploadUrl
);

router.post(
  '/',
  authenticate,
  validate(createDraftSchema),
  LoanController.create
);

router.get(
  '/',
  authenticate,
  validate(loanQuerySchema, 'query'),
  LoanController.getAll
);

router.get(
  '/:id',
  authenticate,
  LoanController.getOne
);

router.patch(
  '/:id',
  authenticate,
  validate(updateDraftSchema),
  LoanController.update
);

router.post(
  '/:id/submit',
  authenticate,
  auditLog('SUBMIT_LOAN', 'loan'),
  LoanController.submit
);

router.delete(
  '/:id',
  authenticate,
  auditLog('DELETE_LOAN', 'loan'),
  LoanController.delete
);

export default router;
