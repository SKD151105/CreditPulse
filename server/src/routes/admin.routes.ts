import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('admin')); // Apply to all routes
router.get('/loans', AdminController.getAllLoans);
router.patch('/loans/:id/assign', auditLog('ASSIGN_LOAN', 'loan'), AdminController.assignLoan);
router.patch('/loans/:id/status', auditLog('UPDATE_LOAN_STATUS', 'loan'), AdminController.updateLoanStatus);
router.get('/loans/:id/audit-logs', AdminController.getLoanAuditLogs);
router.get('/loans/:loanId/documents/:docId/download', AdminController.getDocumentDownloadUrl);

export default router;
