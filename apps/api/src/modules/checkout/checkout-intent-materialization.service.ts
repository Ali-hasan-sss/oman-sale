import { BannerRequestStatus, CheckoutIntentKind } from '@prisma/client';

import { AppEvents } from '../../shared/constants/events';
import { createSlug } from '../../shared/utils/slug';
import { eventBus } from '../../shared/utils/event-bus';
import type { CreateAdDto } from '../ads/ads.validation';
import { assertValidAdCategorySelection } from '../ads/ads-category-validation';
import { adsRepository } from '../ads/ads.repository';
import { notifyAdminBannerRequestPending } from '../banner-requests/banner-admin-notifications';
import { bannerRequestsRepository } from '../banner-requests/banner-requests.repository';
import { promotionsRepository } from '../promotions/promotions.repository';
import { activateStoreSubscription } from '../stores/store-subscription.utils';
import { storesRepository } from '../stores/stores.repository';
import { storesService } from '../stores/stores.service';
import type { CreateStoreDto, SubscribeStoreDto } from '../stores/stores.validation';

export type StoreCreateIntentPayload = {
  dto: CreateStoreDto;
  subscription: {
    planId: string;
    pricingId: string;
    billingPeriod: CreateStoreDto['billingPeriod'];
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    maxListings: number;
  };
};

export type StoreUpgradeIntentPayload = {
  storeId: string;
  subscription: {
    planId: string;
    pricingId: string;
    billingPeriod: SubscribeStoreDto['billingPeriod'];
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    maxListings: number;
  };
};

export type ListingPromotionIntentPayload = {
  planId: string;
  days: number;
  ad?: CreateAdDto;
  adId?: string;
};

export type BannerRequestIntentPayload = {
  imageUrl: string;
  linkUrl: string;
  textAr?: string | null;
  textEn?: string | null;
  durationDays: number;
  totalPrice: number;
};

type MaterializeInput = {
  userId: string;
  kind: CheckoutIntentKind;
  payload: unknown;
};

export async function materializeCheckoutIntent(input: MaterializeInput) {
  switch (input.kind) {
    case CheckoutIntentKind.STORE_CREATE:
      return materializeStoreCreate(input.userId, input.payload as StoreCreateIntentPayload);
    case CheckoutIntentKind.STORE_UPGRADE:
      return materializeStoreUpgrade(input.userId, input.payload as StoreUpgradeIntentPayload);
    case CheckoutIntentKind.LISTING_PROMOTION:
      return materializeListingPromotion(input.userId, input.payload as ListingPromotionIntentPayload);
    case CheckoutIntentKind.BANNER_REQUEST:
      return materializeBannerRequest(input.userId, input.payload as BannerRequestIntentPayload);
    default:
      throw new Error(`Unsupported checkout intent kind: ${input.kind}`);
  }
}

async function materializeStoreCreate(userId: string, payload: StoreCreateIntentPayload) {
  const { store, subscription } = await storesRepository.create(userId, payload.dto, payload.subscription);
  await activateStoreSubscription(subscription.id);

  return {
    storeId: store.id,
    subscriptionId: subscription.id
  };
}

async function materializeStoreUpgrade(userId: string, payload: StoreUpgradeIntentPayload) {
  const store = await storesRepository.findById(payload.storeId);
  if (!store || store.userId !== userId) {
    throw new Error('Store not found');
  }

  await storesRepository.deactivateActiveSubscriptions(payload.storeId);
  const subscription = await storesRepository.createSubscription(payload.storeId, payload.subscription);
  await activateStoreSubscription(subscription.id);

  return {
    storeId: payload.storeId,
    subscriptionId: subscription.id
  };
}

async function materializeListingPromotion(userId: string, payload: ListingPromotionIntentPayload) {
  if (payload.adId) {
    const ad = await promotionsRepository.findAdForPromotion(payload.adId);
    if (!ad || ad.userId !== userId) {
      throw new Error('Ad not found');
    }

    const promotion = await promotionsRepository.promoteAd({
      adId: payload.adId,
      planId: payload.planId,
      days: payload.days
    });

    eventBus.emit(AppEvents.PROMOTION_ACTIVATED, promotion);

    return {
      adId: payload.adId,
      promotionId: promotion.id
    };
  }

  if (!payload.ad) {
    throw new Error('Listing promotion payload is missing ad data');
  }

  if (payload.ad.storeId) {
    await storesService.assertCanPublishAsStore(userId, payload.ad.storeId);
  }

  await assertValidAdCategorySelection(payload.ad.categoryId, payload.ad.filterOptionIds ?? []);

  const slug = `${createSlug(payload.ad.title)}-${Date.now()}`;
  const ad = await adsRepository.create(userId, slug, payload.ad);
  const promotion = await promotionsRepository.promoteAd({
    adId: ad.id,
    planId: payload.planId,
    days: payload.days
  });

  eventBus.emit(AppEvents.PROMOTION_ACTIVATED, promotion);

  return {
    adId: ad.id,
    promotionId: promotion.id
  };
}

async function materializeBannerRequest(userId: string, payload: BannerRequestIntentPayload) {
  const request = await bannerRequestsRepository.createRequest({
    userId,
    imageUrl: payload.imageUrl,
    linkUrl: payload.linkUrl,
    textAr: payload.textAr ?? null,
    textEn: payload.textEn ?? null,
    durationDays: payload.durationDays,
    totalPrice: payload.totalPrice,
    status: BannerRequestStatus.PENDING_APPROVAL
  });

  await notifyAdminBannerRequestPending(request.id).catch(() => undefined);

  return {
    bannerRequestId: request.id
  };
}
