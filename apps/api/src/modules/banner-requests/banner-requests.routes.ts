import { Router } from 'express';
import { z } from 'zod';

import { ensureActiveUser } from '../../shared/middleware/ensure-active-user';
import { requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { bannerRequestsController } from './banner-requests.controller';
import {
  confirmThawaniBannerPaymentSchema,
  createBannerRequestSchema,
  quoteBannerRequestSchema
} from './banner-requests.validation';

export const bannerRequestsRoutes = Router();

bannerRequestsRoutes.get('/pricing', asyncHandler(bannerRequestsController.getPricing));
bannerRequestsRoutes.get(
  '/quote',
  validateRequest({ query: quoteBannerRequestSchema }),
  asyncHandler(bannerRequestsController.quote)
);
bannerRequestsRoutes.post(
  '/',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: createBannerRequestSchema }),
  asyncHandler(bannerRequestsController.create)
);
bannerRequestsRoutes.get(
  '/me',
  requireAuth,
  ensureActiveUser,
  asyncHandler(bannerRequestsController.listMine)
);
bannerRequestsRoutes.post(
  '/payments/thawani/confirm',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: confirmThawaniBannerPaymentSchema }),
  asyncHandler(bannerRequestsController.confirmPayment)
);
bannerRequestsRoutes.post(
  '/payments/thawani/cancel',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: confirmThawaniBannerPaymentSchema }),
  asyncHandler(bannerRequestsController.cancelPayment)
);
