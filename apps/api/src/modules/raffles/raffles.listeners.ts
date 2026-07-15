import { AppEvents } from '../../shared/constants/events';
import { eventBus } from '../../shared/utils/event-bus';
import { rafflesService } from './raffles.service';

type PromotionActivatedPayload = {
  id: string;
};

eventBus.on(AppEvents.PROMOTION_ACTIVATED, (promotion: PromotionActivatedPayload) => {
  if (!promotion?.id) return;

  void rafflesService.awardPointsForPromotion(promotion.id).catch((error) => {
    console.error('[raffles] failed to award promotion points', {
      promotionId: promotion.id,
      error
    });
  });
});
