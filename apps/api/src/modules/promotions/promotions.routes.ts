import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authorize, requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { promotionsController } from './promotions.controller';
import { createPromotionPlanSchema, promoteAdSchema, updatePromotionPlanSchema } from './promotions.validation';
import { z } from 'zod';

export const promotionsRoutes = Router();
const idParams = z.object({ id: z.string().uuid() });

promotionsRoutes.get('/plans', asyncHandler(promotionsController.listPlans));
promotionsRoutes.post(
  '/plans',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ body: createPromotionPlanSchema }),
  asyncHandler(promotionsController.createPlan)
);
promotionsRoutes.patch(
  '/plans/:id',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updatePromotionPlanSchema }),
  asyncHandler(promotionsController.updatePlan)
);
promotionsRoutes.delete(
  '/plans/:id',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(promotionsController.deletePlan)
);
promotionsRoutes.post(
  '/ad-promotions',
  requireAuth,
  validateRequest({ body: promoteAdSchema }),
  asyncHandler(promotionsController.promoteAd)
);
