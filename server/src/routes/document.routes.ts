import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.get(
  '/:docId/download',
  authenticate,
  DocumentController.generateDownloadUrl
);

export default router;
