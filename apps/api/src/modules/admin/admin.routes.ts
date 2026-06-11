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
import { bannerRequestsController } from '../banner-requests/banner-requests.controller';
import {
  listBannerRequestsQuerySchema,
  rejectBannerRequestSchema,
  updateBannerPricingSchema
} from '../banner-requests/banner-requests.validation';
import { heroController } from '../hero/hero.controller';
import {
  createHeaderNavButtonSchema,
  createHeroBannerSchema,
  createHeroSlideSchema,
  listAdminHeroSlidesQuerySchema,
  updateHeaderNavButtonSchema,
  updateHeroBannerSchema,
  updateHeroSlideSchema
} from '../hero/hero.validation';
import { articlesController } from '../articles/articles.controller';
import {
  articleCategorySchema,
  articleSchema,
  listArticlesQuerySchema,
  updateArticleCategorySchema,
  updateArticleSchema
} from '../articles/articles.validation';
import { tourismController } from '../tourism/tourism.controller';
import { tourismDestinationSchema, updateTourismDestinationSchema } from '../tourism/tourism.validation';
import { storeTypesController } from '../store-types/store-types.controller';
import {
  createStoreTypeSchema,
  updateStoreTypeSchema
} from '../store-types/store-types.validation';
import { storesController } from '../stores/stores.controller';
import {
  adminAssignStorePlanSchema,
  listAdminStoresQuerySchema
} from '../stores/stores.validation';
import { adminController } from './admin.controller';
import { listAdminReportsQuerySchema, listAdminUsersQuerySchema, updateAdminUserSchema } from './admin.validation';
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
  '/reports',
  validateRequest({ query: listAdminReportsQuerySchema }),
  asyncHandler(adminController.listReports)
);
adminRoutes.delete(
  '/reports/:id',
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ params: idParams }),
  asyncHandler(adminController.dismissReport)
);
adminRoutes.post(
  '/reports/:id/ban-user',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(adminController.banUserFromReport)
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
adminRoutes.get(
  '/hero-slides',
  validateRequest({ query: listAdminHeroSlidesQuerySchema }),
  asyncHandler(heroController.listForAdmin)
);
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
adminRoutes.get('/header-nav-buttons', asyncHandler(heroController.listHeaderButtonsForAdmin));
adminRoutes.get(
  '/header-nav-buttons/:id',
  validateRequest({ params: idParams }),
  asyncHandler(heroController.getHeaderButtonById)
);
adminRoutes.post(
  '/header-nav-buttons',
  authorize(UserRole.ADMIN),
  validateRequest({ body: createHeaderNavButtonSchema }),
  asyncHandler(heroController.createHeaderButton)
);
adminRoutes.patch(
  '/header-nav-buttons/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateHeaderNavButtonSchema }),
  asyncHandler(heroController.updateHeaderButton)
);
adminRoutes.delete(
  '/header-nav-buttons/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(heroController.deleteHeaderButton)
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
adminRoutes.get(
  '/banner-pricing',
  asyncHandler(bannerRequestsController.getPricing)
);
adminRoutes.patch(
  '/banner-pricing',
  authorize(UserRole.ADMIN),
  validateRequest({ body: updateBannerPricingSchema }),
  asyncHandler(bannerRequestsController.updatePricing)
);
adminRoutes.get(
  '/banner-requests',
  validateRequest({ query: listBannerRequestsQuerySchema }),
  asyncHandler(bannerRequestsController.listForAdmin)
);
adminRoutes.post(
  '/banner-requests/:id/approve',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(bannerRequestsController.approve)
);
adminRoutes.post(
  '/banner-requests/:id/reject',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: rejectBannerRequestSchema }),
  asyncHandler(bannerRequestsController.reject)
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
adminRoutes.get('/article-categories', asyncHandler(articlesController.listCategories));
adminRoutes.post(
  '/article-categories',
  authorize(UserRole.ADMIN),
  validateRequest({ body: articleCategorySchema }),
  asyncHandler(articlesController.createCategory)
);
adminRoutes.patch(
  '/article-categories/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateArticleCategorySchema }),
  asyncHandler(articlesController.updateCategory)
);
adminRoutes.delete(
  '/article-categories/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(articlesController.deleteCategory)
);
adminRoutes.get(
  '/articles',
  validateRequest({ query: listArticlesQuerySchema }),
  asyncHandler(articlesController.listForAdmin)
);
adminRoutes.get('/articles/:idOrSlug', asyncHandler(articlesController.getForAdmin));
adminRoutes.post(
  '/articles',
  authorize(UserRole.ADMIN),
  validateRequest({ body: articleSchema }),
  asyncHandler(articlesController.create)
);
adminRoutes.patch(
  '/articles/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateArticleSchema }),
  asyncHandler(articlesController.update)
);
adminRoutes.delete(
  '/articles/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(articlesController.delete)
);
adminRoutes.get('/store-types', asyncHandler(storeTypesController.listForAdmin));
adminRoutes.get(
  '/store-types/:id',
  validateRequest({ params: idParams }),
  asyncHandler(storeTypesController.getById)
);
adminRoutes.post(
  '/store-types',
  authorize(UserRole.ADMIN),
  validateRequest({ body: createStoreTypeSchema }),
  asyncHandler(storeTypesController.create)
);
adminRoutes.patch(
  '/store-types/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: updateStoreTypeSchema }),
  asyncHandler(storeTypesController.update)
);
adminRoutes.delete(
  '/store-types/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(storeTypesController.delete)
);
adminRoutes.get(
  '/stores',
  validateRequest({ query: listAdminStoresQuerySchema }),
  asyncHandler(storesController.listForAdmin)
);
adminRoutes.get(
  '/stores/:id',
  validateRequest({ params: idParams }),
  asyncHandler(storesController.getByIdForAdmin)
);
adminRoutes.post(
  '/stores/:id/activate',
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ params: idParams }),
  asyncHandler(storesController.activateForAdmin)
);
adminRoutes.post(
  '/stores/:id/deactivate',
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ params: idParams }),
  asyncHandler(storesController.deactivateForAdmin)
);
adminRoutes.post(
  '/stores/:id/assign-plan',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams, body: adminAssignStorePlanSchema }),
  asyncHandler(storesController.assignPlanForAdmin)
);
adminRoutes.post(
  '/stores/:id/renew-subscription',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(storesController.renewSubscriptionForAdmin)
);
adminRoutes.delete(
  '/stores/:id',
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParams }),
  asyncHandler(storesController.removeForAdmin)
);
