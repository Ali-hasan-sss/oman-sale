import { Router } from 'express';

import { ensureActiveUser } from '../../shared/middleware/ensure-active-user';
import { requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { checkoutController } from './checkout.controller';
import { paidListingCheckoutSchema } from './checkout.validation';

export const checkoutRoutes = Router();

checkoutRoutes.post(
  '/paid-listings',
  requireAuth,
  ensureActiveUser,
  validateRequest({ body: paidListingCheckoutSchema }),
  asyncHandler(checkoutController.startPaidListing)
);
