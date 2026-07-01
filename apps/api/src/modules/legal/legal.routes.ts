import { Router } from 'express';

import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { legalController } from './legal.controller';
import { legalKindParamSchema } from './legal.validation';

export const legalRoutes = Router();

legalRoutes.get(
  '/:kind',
  validateRequest({ params: legalKindParamSchema }),
  asyncHandler(legalController.getPublic)
);
