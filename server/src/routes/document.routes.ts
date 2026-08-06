import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.post(
  '/presign',
  authenticate,
  DocumentController.generateUploadUrl
);

router.post(
  '/confirm',
  authenticate,
  DocumentController.confirmUpload
);

router.get(
  '/:docId/download',
  authenticate,
  DocumentController.generateDownloadUrl
);

router.delete(
  '/:docId',
  authenticate,
  DocumentController.deleteDocument
);

export default router;
