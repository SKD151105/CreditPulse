import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('admin')); // Apply to all routes
router.get('/loans', AdminController.getAllLoans);
router.patch('/loans/:id/assign', AdminController.assignLoan);
router.patch('/loans/:id/status', AdminController.updateLoanStatus);

export default router;
