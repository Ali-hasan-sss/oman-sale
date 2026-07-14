import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { confirmThawaniPromotionPayment, cancelThawaniPromotionPayment } from './promotion-checkout.service';
import { promotionsService } from './promotions.service';

export class PromotionsController {
  async listPlans(req: Request, res: Response) {
    res.json({ data: await promotionsService.listPlans(req.query.includeInactive === 'true') });
  }

  async createPlan(req: Request, res: Response) {
    res.status(201).json({ data: await promotionsService.createPlan(req.body) });
  }

  async updatePlan(req: Request, res: Response) {
    res.json({ data: await promotionsService.updatePlan(getRequiredParam(req, 'id'), req.body) });
  }

  async deletePlan(req: Request, res: Response) {
    res.json({ data: await promotionsService.deletePlan(getRequiredParam(req, 'id')) });
  }

  async promoteAd(req: Request, res: Response) {
    const locale = req.query.locale === 'en' ? 'en' : 'ar';
    res.status(201).json({ data: await promotionsService.promoteAd(req.body, req.user!.id, locale) });
  }

  async confirmThawaniPayment(req: Request, res: Response) {
    res.json({ data: await confirmThawaniPromotionPayment(req.user!.id, req.body.sessionId) });
  }

  async cancelThawaniPayment(req: Request, res: Response) {
    res.json({ data: await cancelThawaniPromotionPayment(req.user!.id, req.body.sessionId) });
  }
}

export const promotionsController = new PromotionsController();
