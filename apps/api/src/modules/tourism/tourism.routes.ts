import { Router } from 'express';

import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { tourismController } from './tourism.controller';
import { listTourismDestinationsQuerySchema } from './tourism.validation';

export const tourismRoutes = Router();

tourismRoutes.get(
  '/destinations',
  validateRequest({ query: listTourismDestinationsQuerySchema }),
  asyncHandler(tourismController.list)
);
tourismRoutes.get('/destinations/:idOrSlug', asyncHandler(tourismController.get));
