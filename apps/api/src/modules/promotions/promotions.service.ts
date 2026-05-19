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

    const promotion = await promotionsRepository.promoteAd(dto);
    eventBus.emit(AppEvents.PROMOTION_ACTIVATED, promotion);
    return promotion;
  }
}

export const promotionsService = new PromotionsService();
