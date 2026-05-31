import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { authorize, requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { storePlansController } from './store-plans.controller';
import {
  bulkUpsertStorePlanPricingSchema,
  createStorePlanSchema,
  listStorePlansQuerySchema,
  updateStorePlanDiscountSchema,
  updateStorePlanSchema,
  upsertStorePlanPricingSchema
} from './store-plans.validation';

export const storePlansRoutes = Router();

const idParams = z.object({ id: z.string().uuid() });
const pricingParams = z.object({ pricingId: z.string().uuid() });
const planPricingParams = z.object({ id: z.string().uuid(), pricingId: z.string().uuid() });

storePlansRoutes.get(
  '/',
  validateRequest({ query: listStorePlansQuerySchema }),
  asyncHandler(storePlansController.list)
);

storePlansRoutes.get('/:id', validateRequest({ params: idParams }), asyncHandler(storePlansController.getById));

storePlansRoutes.post(
  '/',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ body: createStorePlanSchema }),
  asyncHandler(storePlansController.create)
);

storePlansRoutes.patch(
  '/:id',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateStorePlanSchema }),
  asyncHandler(storePlansController.update)
);

storePlansRoutes.delete(
  '/:id',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(storePlansController.remove)
);

storePlansRoutes.post(
  '/:id/pricing',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: upsertStorePlanPricingSchema }),
  asyncHandler(storePlansController.upsertPricing)
);

storePlansRoutes.post(
  '/:id/pricing/bulk',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: bulkUpsertStorePlanPricingSchema }),
  asyncHandler(storePlansController.bulkUpsertPricing)
);

storePlansRoutes.patch(
  '/:id/discount',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateStorePlanDiscountSchema }),
  asyncHandler(storePlansController.updatePlanDiscount)
);

storePlansRoutes.patch(
  '/pricing/:pricingId/discount',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: pricingParams, body: updateStorePlanDiscountSchema }),
  asyncHandler(storePlansController.updateDiscount)
);

storePlansRoutes.delete(
  '/:id/pricing/:pricingId',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: planPricingParams }),
  asyncHandler(storePlansController.removePricing)
);
