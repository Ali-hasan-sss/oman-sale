import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authorize, requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { adsController } from '../ads/ads.controller';
import { adminListAdsQuerySchema, createAdSchema, updateAdSchema } from '../ads/ads.validation';
import {
  checkCategorySlugQuerySchema,
  createCategorySchema,
  listAdminCategoriesQuerySchema,
  updateCategorySchema
} from '../categories/categories.validation';
import { heroController } from '../hero/hero.controller';
import {
  createHeroBannerSchema,
  createHeroSlideSchema,
  updateHeroBannerSchema,
  updateHeroSlideSchema
} from '../hero/hero.validation';
import { tourismController } from '../tourism/tourism.controller';
import { tourismDestinationSchema, updateTourismDestinationSchema } from '../tourism/tourism.validation';
import { adminController } from './admin.controller';
import { listAdminUsersQuerySchema, updateAdminUserSchema } from './admin.validation';
import { z } from 'zod';

export const adminRoutes = Router();
const idParams = z.object({ id: z.string().uuid() });

adminRoutes.use(requireAuth, authorize(UserRole.ADMIN, UserRole.MODERATOR));
adminRoutes.get('/statistics', asyncHandler(adminController.statistics));
adminRoutes.get(
  '/ads',
  validateRequest({ query: adminListAdsQuerySchema }),
  asyncHandler(adsController.listForAdmin)
);
adminRoutes.get(
  '/ads/:id',
  validateRequest({ params: idParams }),
  asyncHandler(adsController.getByIdForAdmin)
);
adminRoutes.post(
  '/ads',
  authorize(UserRole.ADMIN),
  validateRequest({ body: createAdSchema }),
  asyncHandler(adsController.createForAdmin)
);
adminRoutes.patch(
  '/ads/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateAdSchema }),
  asyncHandler(adsController.updateForAdmin)
);
adminRoutes.delete(
  '/ads/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(adsController.deleteForAdmin)
);
adminRoutes.post(
  '/ads/:id/restore',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(adsController.restoreForAdmin)
);
adminRoutes.post(
  '/ads/:id/activate',
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ params: idParams }),
  asyncHandler(adsController.activateForAdmin)
);
adminRoutes.post(
  '/ads/:id/deactivate',
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ params: idParams }),
  asyncHandler(adsController.deactivateForAdmin)
);
adminRoutes.get(
  '/users',
  validateRequest({ query: listAdminUsersQuerySchema }),
  asyncHandler(adminController.listUsers)
);
adminRoutes.get(
  '/users/:id',
  validateRequest({ params: idParams }),
  asyncHandler(adminController.getUser)
);
adminRoutes.patch(
  '/users/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateAdminUserSchema }),
  asyncHandler(adminController.updateUser)
);
adminRoutes.get(
  '/categories',
  validateRequest({ query: listAdminCategoriesQuerySchema }),
  asyncHandler(adminController.listCategories)
);
adminRoutes.get(
  '/categories/slug-availability',
  validateRequest({ query: checkCategorySlugQuerySchema }),
  asyncHandler(adminController.checkCategorySlug)
);
adminRoutes.post(
  '/categories',
  authorize(UserRole.ADMIN),
  validateRequest({ body: createCategorySchema }),
  asyncHandler(adminController.createCategory)
);
adminRoutes.patch(
  '/categories/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateCategorySchema }),
  asyncHandler(adminController.updateCategory)
);
adminRoutes.delete(
  '/categories/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(adminController.deleteCategory)
);
adminRoutes.get('/hero-slides', asyncHandler(heroController.listForAdmin));
adminRoutes.get(
  '/hero-slides/:id',
  validateRequest({ params: idParams }),
  asyncHandler(heroController.getById)
);
adminRoutes.post(
  '/hero-slides',
  authorize(UserRole.ADMIN),
  validateRequest({ body: createHeroSlideSchema }),
  asyncHandler(heroController.create)
);
adminRoutes.patch(
  '/hero-slides/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateHeroSlideSchema }),
  asyncHandler(heroController.update)
);
adminRoutes.delete(
  '/hero-slides/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(heroController.delete)
);
adminRoutes.get('/hero-banners', asyncHandler(heroController.listBannersForAdmin));
adminRoutes.get(
  '/hero-banners/:id',
  validateRequest({ params: idParams }),
  asyncHandler(heroController.getBannerById)
);
adminRoutes.post(
  '/hero-banners',
  authorize(UserRole.ADMIN),
  validateRequest({ body: createHeroBannerSchema }),
  asyncHandler(heroController.createBanner)
);
adminRoutes.patch(
  '/hero-banners/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateHeroBannerSchema }),
  asyncHandler(heroController.updateBanner)
);
adminRoutes.delete(
  '/hero-banners/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(heroController.deleteBanner)
);
adminRoutes.get('/tourism-destinations', asyncHandler(tourismController.list));
adminRoutes.get('/tourism-destinations/:idOrSlug', asyncHandler(tourismController.get));
adminRoutes.post(
  '/tourism-destinations',
  authorize(UserRole.ADMIN),
  validateRequest({ body: tourismDestinationSchema }),
  asyncHandler(tourismController.create)
);
adminRoutes.patch(
  '/tourism-destinations/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateTourismDestinationSchema }),
  asyncHandler(tourismController.update)
);
adminRoutes.delete(
  '/tourism-destinations/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(tourismController.delete)
);
