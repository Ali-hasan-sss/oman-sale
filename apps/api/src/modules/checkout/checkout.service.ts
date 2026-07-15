import { CheckoutIntentKind } from '@prisma/client';

import { AppEvents } from '../../shared/constants/events';
import { ApiError } from '../../shared/utils/api-error';
import { eventBus } from '../../shared/utils/event-bus';
import type { CreateAdDto } from '../ads/ads.validation';
import { assertValidAdCategorySelection } from '../ads/ads-category-validation';
import { adsService } from '../ads/ads.service';
import { promotionsRepository } from '../promotions/promotions.repository';
import { storesService } from '../stores/stores.service';
import type { ListingPromotionIntentPayload } from './checkout-intent-materialization.service';
import { startListingPromotionCheckout } from './paid-checkout.service';
import type { PaidListingCheckoutDto } from './checkout.validation';

function getPromotionPlanPrice(
  plan: {
    weekPrice: { toString(): string } | number;
    twoWeeksPrice: { toString(): string } | number;
    monthPrice: { toString(): string } | number;
    pricePerDay: { toString(): string } | number;
  },
  days: number
) {
  if (days === 7) return Number(plan.weekPrice);
  if (days === 14) return Number(plan.twoWeeksPrice);
  if (days === 30) return Number(plan.monthPrice);
  return Number(plan.pricePerDay) * days;
}

export class CheckoutService {
  async startPaidListingCheckout(userId: string, dto: PaidListingCheckoutDto, locale: 'ar' | 'en' = 'ar') {
    if (dto.ad.storeId) {
      await storesService.assertCanPublishAsStore(userId, dto.ad.storeId);
    }

    const plan = await promotionsRepository.findPlanById(dto.planId);
    if (!plan) throw new ApiError(404, 'Promotion plan not found');

    await assertValidAdCategorySelection(dto.ad.categoryId, dto.ad.filterOptionIds ?? [], dto.ad.modelYear);

    const totalPrice = getPromotionPlanPrice(plan, dto.days);
    const payload: ListingPromotionIntentPayload = {
      ad: dto.ad as CreateAdDto,
      planId: dto.planId,
      days: dto.days
    };

    if (totalPrice <= 0) {
      const createdAd = await adsService.create(userId, dto.ad);
      if (!createdAd?.id) throw new ApiError(500, 'Failed to create listing');
      const promotion = await promotionsRepository.promoteAd({
        adId: createdAd.id,
        planId: dto.planId,
        days: dto.days
      });
      eventBus.emit(AppEvents.PROMOTION_ACTIVATED, promotion);
      return { ad: createdAd, promotion, checkout: { paid: true } };
    }

    const checkout = await startListingPromotionCheckout({
      userId,
      payload,
      adTitle: dto.ad.title,
      planName: plan.nameEn || plan.nameAr,
      totalPrice,
      locale
    });

    return {
      checkout: {
        paid: checkout.paid,
        paymentUrl: checkout.paymentUrl,
        sessionId: checkout.sessionId
      }
    };
  }
}

export const checkoutService = new CheckoutService();

export async function loadCheckoutIntentResult(kind: CheckoutIntentKind, result: unknown) {
  const data = result as Record<string, string>;

  if (kind === CheckoutIntentKind.STORE_CREATE && data.storeId) {
    const { storesRepository } = await import('../stores/stores.repository');
    return { store: await storesRepository.findById(data.storeId) };
  }

  if (kind === CheckoutIntentKind.STORE_UPGRADE && data.storeId) {
    const { storesRepository } = await import('../stores/stores.repository');
    return { store: await storesRepository.findById(data.storeId), subscriptionId: data.subscriptionId };
  }

  if (kind === CheckoutIntentKind.LISTING_PROMOTION && data.adId) {
    return { adId: data.adId, promotionId: data.promotionId };
  }

  if (kind === CheckoutIntentKind.BANNER_REQUEST && data.bannerRequestId) {
    const { bannerRequestsRepository } = await import('../banner-requests/banner-requests.repository');
    return { request: await bannerRequestsRepository.findById(data.bannerRequestId) };
  }

  return null;
}
