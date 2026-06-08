import { StoreBillingPeriod, StoreSubscriptionStatus } from '@prisma/client';

import { ErrorCodes } from '../../shared/constants/error-codes';
import { ApiError } from '../../shared/utils/api-error';
import { getMaxStoresPerUser } from '../../config/store-limits';
import { createSlug } from '../../shared/utils/slug';
import { categoriesRepository } from '../categories/categories.repository';
import { computeStorePlanFinalPrice } from '../store-plans/store-plan-pricing.utils';
import { storePlansRepository } from '../store-plans/store-plans.repository';
import { storeTypesRepository } from '../store-types/store-types.repository';
import { checkoutStoreSubscription } from './store-checkout.service';
import {
  applyStoreListingPromotion,
  resolveStoreListingLimit
} from './store-listing-promotion.service';
import { activateStoreTrialSubscription, activateStoreSubscription, getStoreAccessStatus } from './store-subscription.utils';
import { storesRepository } from './stores.repository';
import type {
  AdminAssignStorePlanDto,
  CreateStoreDto,
  ListAdminStoresQuery,
  ListStoresQuery,
  SubscribeStoreDto,
  UpdateStoreDto
} from './stores.validation';
import { resolveMediaUrl } from '../../shared/utils/media-reference';
import { resolveStoreMedia, resolveUserMedia } from '../../shared/utils/resolve-entity-media';
import type { ListAdsQuery } from '../ads/ads.validation';

export class StoresService {
  private mapPublicStoreCard<
    T extends {
      id: string;
      slug: string;
      nameAr: string;
      nameEn: string;
      bioAr: string;
      bioEn: string;
      logoUrl: string | null;
      coverUrl: string | null;
      phone: string | null;
      city?: string | null;
      wilayah?: string | null;
      rootCategory: { id: string; nameAr: string; nameEn: string; slug: string };
      storeType?: { id: string; nameAr: string; nameEn: string; slug: string; icon: string | null } | null;
      _count?: { ads: number };
    }
  >(store: T) {
    return resolveStoreMedia({
      id: store.id,
      slug: store.slug,
      nameAr: store.nameAr,
      nameEn: store.nameEn,
      bioAr: store.bioAr,
      bioEn: store.bioEn,
      logoUrl: store.logoUrl,
      coverUrl: store.coverUrl,
      phone: store.phone,
      city: store.city,
      wilayah: store.wilayah,
      rootCategory: store.rootCategory,
      storeType: store.storeType ?? null,
      listingsCount: store._count?.ads ?? 0
    });
  }

  private mapPublicStoreDetail<
    T extends {
      id: string;
      slug: string;
      nameAr: string;
      nameEn: string;
      bioAr: string;
      bioEn: string;
      logoUrl: string | null;
      coverUrl: string | null;
      phone: string | null;
      rootCategory: { id: string; nameAr: string; nameEn: string; slug: string };
      user?: { id: string; fullName: string; avatar: string | null; isBlocked: boolean } | null;
      _count?: { ads: number };
    }
  >(store: T) {
    return {
      ...this.mapPublicStoreCard(store),
      owner:
        store.user && !store.user.isBlocked
          ? {
              id: store.user.id,
              fullName: store.user.fullName,
              avatar: store.user.avatar ? resolveMediaUrl(store.user.avatar) : store.user.avatar
            }
          : null
    };
  }

  private assertPublicStoreAccessible(store: {
    isActive: boolean;
    subscriptions: Array<{
      status: StoreSubscriptionStatus;
      isActive: boolean;
      isTrial: boolean;
      endsAt: Date | null;
    }>;
  }) {
    if (!store.isActive) throw new ApiError(404, 'Store not found');
    const accessStatus = getStoreAccessStatus(store);
    if (accessStatus !== 'ACTIVE' && accessStatus !== 'TRIAL') {
      throw new ApiError(404, 'Store not found');
    }
  }

  private mapStoreForOwner<
    T extends {
      isActive: boolean;
      subscriptions: Array<{
        status: StoreSubscriptionStatus;
        isActive: boolean;
        isTrial: boolean;
        endsAt: Date | null;
      }>;
    }
  >(store: T) {
    const accessStatus = getStoreAccessStatus(store);
    return resolveStoreMedia({
      ...store,
      accessStatus,
      requiresPayment: accessStatus === 'TRIAL_EXPIRED' || accessStatus === 'SUBSCRIPTION_EXPIRED' || accessStatus === 'DISABLED'
    });
  }

  private async assertRootCategory(categoryId: string) {
    const category = await categoriesRepository.findById(categoryId);
    if (!category) throw new ApiError(404, 'Category not found');
    if (category.parentId) throw new ApiError(400, 'Store must belong to a main category');
    return category;
  }

  private async assertStoreType(storeTypeId: string) {
    const storeType = await storeTypesRepository.findById(storeTypeId);
    if (!storeType || !storeType.isActive) throw new ApiError(404, 'Store type not found');
    return storeType;
  }

  private async resolvePricing(planId: string, rootCategoryId: string, billingPeriod: StoreBillingPeriod) {
    const plan = await storePlansRepository.findPlanById(planId);
    if (!plan || !plan.isActive) throw new ApiError(404, 'Store plan not found');

    const pricing = plan.pricing.find(
      (row) => row.categoryId === rootCategoryId && row.billingPeriod === billingPeriod && !row.deletedAt
    );

    if (!pricing) {
      throw new ApiError(400, 'No pricing configured for this plan and category');
    }

    const computed = computeStorePlanFinalPrice(pricing, {
      discountType: plan.discountType,
      discountValue: plan.discountValue,
      isDiscountActive: plan.isDiscountActive
    });
    return { plan, pricing, ...computed };
  }

  async listPlansForCategory(rootCategoryId: string, userId?: string) {
    const plans = await storePlansRepository.listPlans({ categoryId: rootCategoryId, includeInactive: false });

    const mapPlan = (plan: (typeof plans)[number], trialAvailable?: boolean) => {
      const planDiscount = {
        discountType: plan.discountType,
        discountValue: plan.discountValue,
        isDiscountActive: plan.isDiscountActive
      };

      return {
        ...plan,
        ...(trialAvailable !== undefined && { trialAvailable }),
        pricing: plan.pricing.map((row) => {
          const computed = computeStorePlanFinalPrice(row, planDiscount);
          return { ...row, ...computed };
        })
      };
    };

    if (!userId) {
      return plans.map((plan) => mapPlan(plan));
    }

    const trialUsage = await Promise.all(
      plans.map((plan) => storesRepository.hasUserUsedPlanTrial(userId, plan.id))
    );

    return plans.map((plan, index) =>
      mapPlan(plan, plan.trialDays > 0 && !trialUsage[index])
    );
  }

  list(query: ListStoresQuery) {
    return storesRepository.listPublic(query).then((result) => ({
      ...result,
      items: result.items.map((store) => this.mapPublicStoreCard(store))
    }));
  }

  async getBySlug(slug: string) {
    const store = await storesRepository.findBySlug(slug);
    if (!store) throw new ApiError(404, 'Store not found');
    this.assertPublicStoreAccessible(store);
    return this.mapPublicStoreDetail(store);
  }

  async listPublicAdsBySlug(slug: string, query: ListAdsQuery) {
    const store = await storesRepository.findBySlug(slug);
    if (!store) throw new ApiError(404, 'Store not found');
    this.assertPublicStoreAccessible(store);
    return storesRepository.listPublicAds(store.id, query);
  }

  async getMine(userId: string) {
    const stores = await storesRepository.listForUser(userId);
    return stores.map((store) => this.mapStoreForOwner(store));
  }

  async getByIdForOwner(id: string, userId: string) {
    const store = await storesRepository.findById(id);
    if (!store) throw new ApiError(404, 'Store not found');
    if (store.userId !== userId) throw new ApiError(403, 'Forbidden');
    return this.mapStoreForOwner(store);
  }

  async create(userId: string, dto: CreateStoreDto, locale: 'ar' | 'en' = 'ar') {
    await this.assertCanCreateStore(userId);
    await this.assertRootCategory(dto.rootCategoryId);
    await this.assertStoreType(dto.storeTypeId);
    const resolved = await this.resolvePricing(dto.planId, dto.rootCategoryId, dto.billingPeriod);

    const { store, subscription } = await storesRepository.create(userId, dto, {
      planId: dto.planId,
      pricingId: resolved.pricing.id,
      billingPeriod: dto.billingPeriod,
      basePrice: resolved.basePrice,
      discountAmount: resolved.discountAmount,
      finalPrice: resolved.finalPrice,
      maxListings: resolved.pricing.maxListings
    });

    const trialEligible =
      resolved.plan.trialDays > 0 && !(await storesRepository.hasUserUsedPlanTrial(userId, dto.planId));

    if (trialEligible) {
      await activateStoreTrialSubscription(subscription.id, resolved.plan.trialDays);
      return {
        store: await storesRepository.findById(store.id),
        subscription,
        checkout: { activated: true },
        requiresPayment: false,
        isFreePlan: false,
        isTrial: true
      };
    }

    try {
      const checkout = await checkoutStoreSubscription({
        userId,
        subscriptionId: subscription.id,
        storeName: dto.nameAr || dto.nameEn,
        finalPrice: resolved.finalPrice,
        locale
      });

      return {
        store: await storesRepository.findById(store.id),
        subscription,
        checkout,
        requiresPayment: !checkout.activated,
        isFreePlan: resolved.finalPrice <= 0,
        isTrial: false
      };
    } catch (error) {
      await storesRepository.rollbackPendingStoreCreation(store.id);
      throw error;
    }
  }

  async update(id: string, userId: string, dto: UpdateStoreDto) {
    const store = await this.getByIdForOwner(id, userId);

    if (dto.slug && dto.slug !== store.slug) {
      const nextSlug = createSlug(dto.slug);
      const existing = await storesRepository.slugTaken(nextSlug, id);
      if (existing) throw new ApiError(409, 'Store slug already exists');
    }

    if (dto.storeTypeId) {
      await this.assertStoreType(dto.storeTypeId);
    }

    return storesRepository.update(id, dto);
  }

  async remove(id: string, userId: string) {
    await this.getByIdForOwner(id, userId);
    await this.softDeleteStore(id);
  }

  private async assertCanCreateStore(userId: string) {
    const maxStores = getMaxStoresPerUser();
    const existingCount = await storesRepository.countForUser(userId);
    if (existingCount >= maxStores) {
      throw new ApiError(
        409,
        'User already has the maximum number of stores allowed',
        ErrorCodes.STORE_LIMIT_REACHED,
        { maxStores }
      );
    }
  }

  private async softDeleteStore(id: string) {
    await storesRepository.deactivateActiveSubscriptions(id);
    await storesRepository.setStoreAdsActive(id, false);
    return storesRepository.softDelete(id);
  }

  async activatePaid(id: string, userId: string, locale: 'ar' | 'en' = 'ar') {
    const store = await this.getByIdForOwner(id, userId);
    const activeTrial = store.subscriptions.find(
      (subscription) =>
        subscription.isActive &&
        subscription.isTrial &&
        subscription.status === StoreSubscriptionStatus.ACTIVE
    );

    if (!activeTrial) {
      throw new ApiError(400, 'No active trial subscription to activate');
    }

    if (Number(activeTrial.finalPrice) <= 0) {
      const { activateStoreSubscription } = await import('./store-subscription.utils');
      await activateStoreSubscription(activeTrial.id);
      return {
        store: await storesRepository.findById(id).then((row) => (row ? this.mapStoreForOwner(row) : row)),
        subscription: activeTrial,
        checkout: { activated: true },
        requiresPayment: false
      };
    }

    const checkout = await checkoutStoreSubscription({
      userId,
      subscriptionId: activeTrial.id,
      storeName: store.nameAr || store.nameEn,
      finalPrice: Number(activeTrial.finalPrice),
      locale
    });

    return {
      store,
      subscription: activeTrial,
      checkout,
      requiresPayment: !checkout.activated
    };
  }

  async subscribe(id: string, userId: string, dto: SubscribeStoreDto, locale: 'ar' | 'en' = 'ar') {
    const store = await this.getByIdForOwner(id, userId);
    const resolved = await this.resolvePricing(dto.planId, store.rootCategoryId, dto.billingPeriod);

    await storesRepository.deactivateActiveSubscriptions(id);

    const subscription = await storesRepository.createSubscription(id, {
      planId: dto.planId,
      pricingId: resolved.pricing.id,
      billingPeriod: dto.billingPeriod,
      basePrice: resolved.basePrice,
      discountAmount: resolved.discountAmount,
      finalPrice: resolved.finalPrice,
      maxListings: resolved.pricing.maxListings
    });

    const checkout = await checkoutStoreSubscription({
      userId,
      subscriptionId: subscription.id,
      storeName: store.nameAr || store.nameEn,
      finalPrice: resolved.finalPrice,
      locale
    });

    return {
      subscription,
      checkout,
      requiresPayment: !checkout.activated,
      isFreePlan: resolved.finalPrice <= 0
    };
  }

  async assertCanPublishAsStore(userId: string, storeId: string) {
    const store = await storesRepository.findById(storeId);
    if (!store || store.userId !== userId) {
      throw new ApiError(403, 'You can only publish listings for your own store');
    }

    const accessStatus = getStoreAccessStatus(store);
    if (accessStatus !== 'ACTIVE' && accessStatus !== 'TRIAL') {
      throw new ApiError(403, 'Store subscription is not active');
    }

    if (!store.isActive) {
      throw new ApiError(403, 'Store is not active');
    }

    const now = new Date();
    const activeSubscription = store.subscriptions.find(
      (subscription) =>
        subscription.isActive &&
        subscription.status === StoreSubscriptionStatus.ACTIVE &&
        subscription.endsAt &&
        subscription.endsAt > now
    );

    if (!activeSubscription) {
      throw new ApiError(403, 'No active store subscription found');
    }

    const listingCount = await storesRepository.countActiveListings(storeId);
    const maxListings = resolveStoreListingLimit({
      isTrial: activeSubscription.isTrial,
      maxListings: activeSubscription.maxListings,
      plan: activeSubscription.plan
    });

    if (listingCount >= maxListings) {
      throw new ApiError(
        400,
        'Store listing limit reached for your current plan',
        ErrorCodes.STORE_LISTING_LIMIT_REACHED
      );
    }

    return store;
  }

  async applyStoreListingPromotion(adId: string, storeId: string) {
    return applyStoreListingPromotion(adId, storeId);
  }

  private mapStoreForAdmin<
    T extends {
      isActive: boolean;
      subscriptions: Array<{
        status: StoreSubscriptionStatus;
        isActive: boolean;
        isTrial: boolean;
        endsAt: Date | null;
      }>;
      _count?: { ads: number };
      user?: { avatar?: string | null } | null;
    }
  >(store: T) {
    const accessStatus = getStoreAccessStatus(store);
    const resolved = resolveStoreMedia(store);

    return {
      ...resolved,
      accessStatus,
      listingsCount: store._count?.ads ?? 0,
      user: store.user ? resolveUserMedia(store.user) : store.user
    };
  }

  async listForAdmin(query: ListAdminStoresQuery) {
    const result = await storesRepository.listForAdmin(query);
    return {
      ...result,
      items: result.items.map((store) => this.mapStoreForAdmin(store))
    };
  }

  async getByIdForAdmin(id: string) {
    const store = await storesRepository.findById(id);
    if (!store) throw new ApiError(404, 'Store not found');
    const listingsCount = await storesRepository.countActiveListings(id);
    return this.mapStoreForAdmin({ ...store, _count: { ads: listingsCount } });
  }

  async activateForAdmin(id: string) {
    const store = await storesRepository.findById(id);
    if (!store) throw new ApiError(404, 'Store not found');

    await storesRepository.setActive(id, true);
    await storesRepository.setStoreAdsActive(id, true);
    return this.getByIdForAdmin(id);
  }

  async deactivateForAdmin(id: string) {
    const store = await storesRepository.findById(id);
    if (!store) throw new ApiError(404, 'Store not found');

    await storesRepository.setActive(id, false);
    await storesRepository.setStoreAdsActive(id, false);
    return this.getByIdForAdmin(id);
  }

  async assignPlanForAdmin(id: string, dto: AdminAssignStorePlanDto) {
    const store = await storesRepository.findById(id);
    if (!store) throw new ApiError(404, 'Store not found');

    const resolved = await this.resolvePricing(dto.planId, store.rootCategoryId, dto.billingPeriod);
    await storesRepository.deactivateActiveSubscriptions(id);

    const subscription = await storesRepository.createSubscription(id, {
      planId: dto.planId,
      pricingId: resolved.pricing.id,
      billingPeriod: dto.billingPeriod,
      basePrice: resolved.basePrice,
      discountAmount: resolved.discountAmount,
      finalPrice: resolved.finalPrice,
      maxListings: resolved.pricing.maxListings
    });

    await activateStoreSubscription(subscription.id);
    return this.getByIdForAdmin(id);
  }

  async removeForAdmin(id: string) {
    const store = await storesRepository.findById(id);
    if (!store) throw new ApiError(404, 'Store not found');
    await this.softDeleteStore(id);
    return { id, deleted: true };
  }

  async listAds(storeId: string, userId: string, query: ListAdsQuery) {
    await this.getByIdForOwner(storeId, userId);
    return storesRepository.listAds(storeId, query);
  }
}

export const storesService = new StoresService();
