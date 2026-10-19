import type { Request, Response } from 'express';

import { resolveBannerPlacement } from '../banners/banner-placements';
import { getRequiredParam } from '../../shared/utils/request';
import { bannerRequestsService } from './banner-requests.service';
import type { ListBannerRequestsQuery } from './banner-requests.validation';

export class BannerRequestsController {
  async getPricing(req: Request, res: Response) {
    res.json({ data: await bannerRequestsService.getPricing(resolveBannerPlacement(req.query.placement)) });
  }

  async quote(req: Request, res: Response) {
    res.json({
      data: await bannerRequestsService.quotePrice(
        Number(req.query.durationDays),
        resolveBannerPlacement(req.query.placement)
      )
    });
  }

  async create(req: Request, res: Response) {
    const locale = req.query.locale === 'en' ? 'en' : 'ar';
    res.status(201).json({
      data: await bannerRequestsService.createRequest(req.user!.id, req.body, locale)
    });
  }

  async listMine(req: Request, res: Response) {
    res.json({ data: await bannerRequestsService.listMine(req.user!.id) });
  }

  async confirmPayment(req: Request, res: Response) {
    res.json({ data: await bannerRequestsService.confirmPayment(req.user!.id, req.body.sessionId) });
  }

  async cancelPayment(req: Request, res: Response) {
    res.json({ data: await bannerRequestsService.cancelPayment(req.user!.id, req.body.sessionId) });
  }

  async listForAdmin(req: Request, res: Response) {
    res.json({ data: await bannerRequestsService.listForAdmin(req.query as unknown as ListBannerRequestsQuery) });
  }

  async updatePricing(req: Request, res: Response) {
    res.json({ data: await bannerRequestsService.updatePricing(req.body) });
  }

  async approve(req: Request, res: Response) {
    res.json({ data: await bannerRequestsService.approve(getRequiredParam(req, 'id')) });
  }

  async reject(req: Request, res: Response) {
    res.json({
      data: await bannerRequestsService.reject(getRequiredParam(req, 'id'), req.body)
    });
  }
}

export const bannerRequestsController = new BannerRequestsController();
