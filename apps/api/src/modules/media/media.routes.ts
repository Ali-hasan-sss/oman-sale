import { Router } from 'express';
import multer from 'multer';

import { requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { mediaController } from './media.controller';
import { uploadMediaQuerySchema } from './media.validation';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }
});

export const mediaRoutes = Router();

mediaRoutes.get('/config', asyncHandler(mediaController.getConfig));

mediaRoutes.get(/^\/files\/(.+)$/, asyncHandler(mediaController.streamFile));

mediaRoutes.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  validateRequest({ query: uploadMediaQuerySchema }),
  asyncHandler(mediaController.upload)
);
