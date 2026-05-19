import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { paymentsController } from './payments.controller';
import { createPaymentSchema } from './payments.validation';

export const paymentsRoutes = Router();

paymentsRoutes.use(requireAuth);
paymentsRoutes.get('/', asyncHandler(paymentsController.list));
paymentsRoutes.post(
  '/',
  validateRequest({ body: createPaymentSchema }),
  asyncHandler(paymentsController.create)
);
