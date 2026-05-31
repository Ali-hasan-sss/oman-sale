import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { authorize, optionalAuth, requireAuth } from '../../shared/middleware/auth';
import { ensureActiveUser } from '../../shared/middleware/ensure-active-user';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { adsController } from './ads.controller';
import { createAdSchema, listAdsQuerySchema, reportAdSchema, updateAdSchema } from './ads.validation';

const idParams = z.object({ id: z.string().uuid() });

export const adsRoutes = Router();

adsRoutes.get('/', validateRequest({ query: listAdsQuerySchema }), asyncHandler(adsController.list));
adsRoutes.get('/all', validateRequest({ query: listAdsQuerySchema }), asyncHandler(adsController.list));
adsRoutes.get('/latest', validateRequest({ query: listAdsQuerySchema }), asyncHandler(adsController.latest));
adsRoutes.get('/featured', validateRequest({ query: listAdsQuerySchema }), asyncHandler(adsController.featured));
adsRoutes.get('/my', requireAuth, ensureActiveUser, validateRequest({ query: listAdsQuerySchema }), asyncHandler(adsController.listForUser));
adsRoutes.get('/favorites', requireAuth, ensureActiveUser, asyncHandler(adsController.favorites));
adsRoutes.get('/favorites/ids', requireAuth, ensureActiveUser, asyncHandler(adsController.favoriteIds));
adsRoutes.get('/:id/similar', validateRequest({ params: idParams }), asyncHandler(adsController.similar));
adsRoutes.get('/:id', optionalAuth, validateRequest({ params: idParams }), asyncHandler(adsController.getById));
adsRoutes.post(
  '/',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: createAdSchema }),
  asyncHandler(adsController.create)
);
adsRoutes.patch(
  '/:id',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams, body: updateAdSchema }),
  asyncHandler(adsController.update)
);
adsRoutes.post(
  '/:id/sold',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(adsController.markSold)
);
adsRoutes.delete(
  '/:id/sold',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(adsController.unmarkSold)
);
adsRoutes.post(
  '/:id/approve',
  requireAuth,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ params: idParams }),
  asyncHandler(adsController.approve)
);
adsRoutes.post(
  '/:id/favorite',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(adsController.favorite)
);
adsRoutes.delete(
  '/:id/favorite',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(adsController.unfavorite)
);
adsRoutes.post(
  '/:id/reports',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams, body: reportAdSchema }),
  asyncHandler(adsController.report)
);
adsRoutes.delete(
  '/:id',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(adsController.delete)
);
