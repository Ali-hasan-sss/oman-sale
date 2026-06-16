import { ErrorCodes } from '../../shared/constants/error-codes';
import { AppEvents } from '../../shared/constants/events';
import { ApiError } from '../../shared/utils/api-error';
import { eventBus } from '../../shared/utils/event-bus';
import { promotionsRepository } from './promotions.repository';
import type { CreatePromotionPlanDto, PromoteAdDto, UpdatePromotionPlanDto } from './promotions.validation';

export class PromotionsService {
  listPlans(includeInactive = false) {
    return promotionsRepository.listPlans(includeInactive);
  }

  createPlan(dto: CreatePromotionPlanDto) {
    return promotionsRepository.createPlan(dto);
  }

  async updatePlan(id: string, dto: UpdatePromotionPlanDto) {
    const plan = await promotionsRepository.findPlanById(id);
    if (!plan) throw new ApiError(404, 'Promotion plan not found');
    return promotionsRepository.updatePlan(id, dto);
  }

  async deletePlan(id: string) {
    const plan = await promotionsRepository.findPlanById(id);
    if (!plan) throw new ApiError(404, 'Promotion plan not found');
    return promotionsRepository.softDeletePlan(id);
  }

  async promoteAd(dto: PromoteAdDto, userId: string) {
    const ad = await promotionsRepository.findAdForPromotion(dto.adId);
    if (!ad) throw new ApiError(404, 'Ad not found');
    if (ad.userId !== userId) throw new ApiError(403, 'Only owner can promote ad');

    const plan = await promotionsRepository.findPlanById(dto.planId);
    if (!plan) throw new ApiError(404, 'Promotion plan not found');

    const totalPrice = getPromotionPlanPrice(plan, dto.days);
    if (totalPrice > 0) {
      throw new ApiError(
        503,
        'Ad promotion payment will be available soon',
        ErrorCodes.PAYMENT_COMING_SOON
      );
    }

    const promotion = await promotionsRepository.promoteAd(dto);
    eventBus.emit(AppEvents.PROMOTION_ACTIVATED, promotion);
    return promotion;
  }
}

export const promotionsService = new PromotionsService();

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
