import { Router } from 'express';
import { z } from 'zod';

import { ensureActiveUser } from '../../shared/middleware/ensure-active-user';
import { optionalAuth, requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { storesController } from './stores.controller';
import {
  confirmThawaniPaymentSchema,
  createStoreSchema,
  listStorePlansForCategoryQuerySchema,
  listStoresQuerySchema,
  subscribeStoreSchema,
  updateStoreSchema
} from './stores.validation';
import { listAdsQuerySchema } from '../ads/ads.validation';

export const storesRoutes = Router();

const idParams = z.object({ id: z.string().uuid() });
const slugParams = z.object({ slug: z.string().trim().min(2).max(100) });

storesRoutes.get('/', validateRequest({ query: listStoresQuerySchema }), asyncHandler(storesController.list));
storesRoutes.get(
  '/plans',
  optionalAuth,
  validateRequest({ query: listStorePlansForCategoryQuerySchema }),
  asyncHandler(storesController.listPlans)
);
storesRoutes.post(
  '/payments/thawani/confirm',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: confirmThawaniPaymentSchema }),
  asyncHandler(storesController.confirmThawaniPayment)
);
storesRoutes.get('/me', requireAuth, ensureActiveUser, asyncHandler(storesController.getMine));
storesRoutes.get('/slug/:slug', validateRequest({ params: slugParams }), asyncHandler(storesController.getBySlug));
storesRoutes.get(
  '/slug/:slug/ads',
  validateRequest({ params: slugParams, query: listAdsQuerySchema }),
  asyncHandler(storesController.listAdsBySlug)
);

storesRoutes.get(
  '/:id/ads',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams, query: listAdsQuerySchema }),
  asyncHandler(storesController.listAds)
);

storesRoutes.get(
  '/:id',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(storesController.getById)
);

storesRoutes.post(
  '/',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: createStoreSchema }),
  asyncHandler(storesController.create)
);

storesRoutes.patch(
  '/:id',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams, body: updateStoreSchema }),
  asyncHandler(storesController.update)
);

storesRoutes.delete(
  '/:id',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(storesController.remove)
);

storesRoutes.post(
  '/:id/activate-paid',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(storesController.activatePaid)
);

storesRoutes.post(
  '/:id/subscribe',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams, body: subscribeStoreSchema }),
  asyncHandler(storesController.subscribe)
);
