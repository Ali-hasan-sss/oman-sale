import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { notificationsController } from './notifications.controller';
import { registerPushTokenSchema, removePushTokenSchema } from './notifications.validation';

const idParams = z.object({ id: z.string().uuid() });

export const notificationsRoutes = Router();

notificationsRoutes.use(requireAuth);
notificationsRoutes.get('/', asyncHandler(notificationsController.list));
notificationsRoutes.get('/unread-count', asyncHandler(notificationsController.unreadCount));
notificationsRoutes.post(
  '/push-token',
  validateRequest({ body: registerPushTokenSchema }),
  asyncHandler(notificationsController.registerPushToken)
);
notificationsRoutes.delete(
  '/push-token',
  validateRequest({ body: removePushTokenSchema }),
  asyncHandler(notificationsController.removePushToken)
);
notificationsRoutes.post('/read-all', asyncHandler(notificationsController.markAllRead));
notificationsRoutes.post(
  '/:id/read',
  validateRequest({ params: idParams }),
  asyncHandler(notificationsController.markRead)
);
