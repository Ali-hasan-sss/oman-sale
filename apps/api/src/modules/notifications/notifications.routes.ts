import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { notificationsController } from './notifications.controller';

const idParams = z.object({ id: z.string().uuid() });

export const notificationsRoutes = Router();

notificationsRoutes.use(requireAuth);
notificationsRoutes.get('/', asyncHandler(notificationsController.list));
notificationsRoutes.post(
  '/:id/read',
  validateRequest({ params: idParams }),
  asyncHandler(notificationsController.markRead)
);
