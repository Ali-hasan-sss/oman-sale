import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { requireAuth, authorize } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { categoriesController } from './categories.controller';
import { createCategoryFilterSchema, createCategorySchema, listCategoriesQuerySchema, updateCategoryFilterSchema, updateCategorySchema } from './categories.validation';

const idParams = z.object({ id: z.string().uuid() });

export const categoriesRoutes = Router();

categoriesRoutes.get('/', validateRequest({ query: listCategoriesQuerySchema }), asyncHandler(categoriesController.list));
categoriesRoutes.get('/:id/filters', validateRequest({ params: idParams }), asyncHandler(categoriesController.listFilters));
categoriesRoutes.post(
  '/',
  requireAuth,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ body: createCategorySchema }),
  asyncHandler(categoriesController.create)
);
categoriesRoutes.post(
  '/:id/filters',
  requireAuth,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ params: idParams, body: createCategoryFilterSchema }),
  asyncHandler(categoriesController.createFilter)
);
categoriesRoutes.patch(
  '/filters/:filterId',
  requireAuth,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ params: z.object({ filterId: z.string().uuid() }), body: updateCategoryFilterSchema }),
  asyncHandler(categoriesController.updateFilter)
);
categoriesRoutes.delete(
  '/filters/:filterId',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: z.object({ filterId: z.string().uuid() }) }),
  asyncHandler(categoriesController.deleteFilter)
);
categoriesRoutes.patch(
  '/:id',
  requireAuth,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ params: idParams, body: updateCategorySchema }),
  asyncHandler(categoriesController.update)
);
categoriesRoutes.delete(
  '/:id',
  requireAuth,
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(categoriesController.delete)
);
