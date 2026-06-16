import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/auth';
import { ensureActiveUser, ensureActiveUserAllowIncomplete } from '../../shared/middleware/ensure-active-user';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { trustBadgeController } from './trust-badge.controller';
import {
  listTrustBadgeQuerySchema,
  rejectTrustBadgeSchema,
  submitStoreTrustBadgeSchema,
  submitUserTrustBadgeSchema
} from './trust-badge.validation';

export const trustBadgeRoutes = Router();

trustBadgeRoutes.get(
  '/users/me',
  requireAuth,
  ensureActiveUserAllowIncomplete,
  asyncHandler(trustBadgeController.getUserMine)
);
trustBadgeRoutes.post(
  '/users/me',
  requireAuth,
  ensureActiveUserAllowIncomplete,
  validateRequest({ body: submitUserTrustBadgeSchema }),
  asyncHandler(trustBadgeController.submitUserMine)
);
trustBadgeRoutes.get(
  '/stores/:storeId',
  requireAuth,
  ensureActiveUser,
  asyncHandler(trustBadgeController.getStoreMine)
);
trustBadgeRoutes.post(
  '/stores/:storeId',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: submitStoreTrustBadgeSchema }),
  asyncHandler(trustBadgeController.submitStoreMine)
);
