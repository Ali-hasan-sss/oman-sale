import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authorize, requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { usersController } from './users.controller';
import { changePasswordSchema, requestEmailChangeSchema, updateProfileSchema, verifyEmailChangeSchema } from './users.validation';

export const usersRoutes = Router();

usersRoutes.get('/me', requireAuth, asyncHandler(usersController.me));
usersRoutes.patch('/me', requireAuth, validateRequest({ body: updateProfileSchema }), asyncHandler(usersController.updateProfile));
usersRoutes.patch(
  '/me/password',
  requireAuth,
  validateRequest({ body: changePasswordSchema }),
  asyncHandler(usersController.changePassword)
);
usersRoutes.post(
  '/me/email-change',
  requireAuth,
  validateRequest({ body: requestEmailChangeSchema }),
  asyncHandler(usersController.requestEmailChange)
);
usersRoutes.post(
  '/me/email-change/verify',
  requireAuth,
  validateRequest({ body: verifyEmailChangeSchema }),
  asyncHandler(usersController.verifyEmailChange)
);
usersRoutes.get('/', requireAuth, authorize(UserRole.ADMIN), asyncHandler(usersController.list));
