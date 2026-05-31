import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authorize, requireAuth } from '../../shared/middleware/auth';
import { ensureActiveUser } from '../../shared/middleware/ensure-active-user';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { usersController } from './users.controller';
import { changePasswordSchema, requestEmailChangeSchema, updateProfileSchema, verifyEmailChangeSchema } from './users.validation';

export const usersRoutes = Router();

usersRoutes.get('/me', requireAuth, ensureActiveUser, asyncHandler(usersController.me));
usersRoutes.patch('/me', requireAuth, ensureActiveUser, validateRequest({ body: updateProfileSchema }), asyncHandler(usersController.updateProfile));
usersRoutes.patch(
  '/me/password',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: changePasswordSchema }),
  asyncHandler(usersController.changePassword)
);
usersRoutes.post(
  '/me/email-change',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: requestEmailChangeSchema }),
  asyncHandler(usersController.requestEmailChange)
);
usersRoutes.post(
  '/me/email-change/verify',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: verifyEmailChangeSchema }),
  asyncHandler(usersController.verifyEmailChange)
);
usersRoutes.get('/', requireAuth, authorize(UserRole.ADMIN), asyncHandler(usersController.list));
