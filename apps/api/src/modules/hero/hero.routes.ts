import { Router } from 'express';

import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { heroController } from './hero.controller';
import { listHeroSlidesQuerySchema } from './hero.validation';

export const heroRoutes = Router();

heroRoutes.get(
  '/slides',
  validateRequest({ query: listHeroSlidesQuerySchema }),
  asyncHandler(heroController.listPublic)
);

heroRoutes.get(
  '/banners',
  validateRequest({ query: listHeroSlidesQuerySchema }),
  asyncHandler(heroController.listBannersPublic)
);
