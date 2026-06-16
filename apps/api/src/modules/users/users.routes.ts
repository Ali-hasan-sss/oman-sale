import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authorize, requireAuth } from '../../shared/middleware/auth';
import { ensureActiveUser, ensureActiveUserAllowIncomplete } from '../../shared/middleware/ensure-active-user';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { usersController } from './users.controller';
import { changePasswordSchema, requestEmailChangeSchema, requestPhoneVerificationSchema, updateProfileSchema, verifyEmailChangeSchema, verifyPhoneSchema } from './users.validation';

export const usersRoutes = Router();

usersRoutes.get('/me', requireAuth, ensureActiveUserAllowIncomplete, asyncHandler(usersController.me));
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
usersRoutes.post(
  '/me/phone-verification',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: requestPhoneVerificationSchema }),
  asyncHandler(usersController.requestPhoneVerification)
);
usersRoutes.post(
  '/me/phone-verification/verify',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: verifyPhoneSchema }),
  asyncHandler(usersController.verifyPhone)
);
usersRoutes.get('/', requireAuth, authorize(UserRole.ADMIN), asyncHandler(usersController.list));
