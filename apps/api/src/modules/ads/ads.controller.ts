import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { getViewerContext } from '../../shared/utils/viewer-context';
import { adsService } from './ads.service';
import type { AdminListAdsQuery, ListAdsQuery } from './ads.validation';

export class AdsController {
  async list(req: Request, res: Response) {
    res.json({ data: await adsService.list(req.query as unknown as ListAdsQuery) });
  }

  async latest(req: Request, res: Response) {
    res.json({ data: await adsService.listLatest(req.query as unknown as ListAdsQuery) });
  }

  async featured(req: Request, res: Response) {
    res.json({ data: await adsService.listFeatured(req.query as unknown as ListAdsQuery) });
  }

  async listForAdmin(req: Request, res: Response) {
    res.json({ data: await adsService.listForAdmin(req.query as unknown as AdminListAdsQuery) });
  }

  async listForUser(req: Request, res: Response) {
    res.json({ data: await adsService.listForUser(req.user!.id, req.query as unknown as ListAdsQuery) });
  }

  async getById(req: Request, res: Response) {
    res.json({ data: await adsService.getById(getRequiredParam(req, 'id'), getViewerContext(req)) });
  }

  async getByIdForAdmin(req: Request, res: Response) {
    res.json({ data: await adsService.getByIdForAdmin(getRequiredParam(req, 'id')) });
  }

  async similar(req: Request, res: Response) {
    res.json({ data: await adsService.listSimilar(getRequiredParam(req, 'id')) });
  }

  async favorites(req: Request, res: Response) {
    res.json({ data: await adsService.listFavorites(req.user!.id) });
  }

  async favoriteIds(req: Request, res: Response) {
    res.json({ data: await adsService.listFavoriteIds(req.user!.id) });
  }

  async create(req: Request, res: Response) {
    res.status(201).json({ data: await adsService.create(req.user!.id, req.body) });
  }

  async createForAdmin(req: Request, res: Response) {
    res.status(201).json({ data: await adsService.createForAdmin(req.user!.id, req.body) });
  }

  async update(req: Request, res: Response) {
    res.json({ data: await adsService.update(getRequiredParam(req, 'id'), req.user!.id, req.body) });
  }

  async updateForAdmin(req: Request, res: Response) {
    res.json({ data: await adsService.updateForAdmin(getRequiredParam(req, 'id'), req.body) });
  }

  async approve(req: Request, res: Response) {
    res.json({ data: await adsService.approve(getRequiredParam(req, 'id')) });
  }

  async delete(req: Request, res: Response) {
    res.json({ data: await adsService.delete(getRequiredParam(req, 'id'), req.user!.id) });
  }

  async deleteForAdmin(req: Request, res: Response) {
    res.json({ data: await adsService.deleteForAdmin(getRequiredParam(req, 'id')) });
  }

  async restoreForAdmin(req: Request, res: Response) {
    res.json({ data: await adsService.restoreForAdmin(getRequiredParam(req, 'id')) });
  }

  async activateForAdmin(req: Request, res: Response) {
    res.json({ data: await adsService.activateForAdmin(getRequiredParam(req, 'id')) });
  }

  async deactivateForAdmin(req: Request, res: Response) {
    res.json({ data: await adsService.deactivateForAdmin(getRequiredParam(req, 'id')) });
  }

  async markSold(req: Request, res: Response) {
    res.json({ data: await adsService.markSold(getRequiredParam(req, 'id'), req.user!.id) });
  }

  async unmarkSold(req: Request, res: Response) {
    res.json({ data: await adsService.unmarkSold(getRequiredParam(req, 'id'), req.user!.id) });
  }

  async favorite(req: Request, res: Response) {
    res.status(201).json({ data: await adsService.favorite(getRequiredParam(req, 'id'), req.user!.id) });
  }

  async unfavorite(req: Request, res: Response) {
    res.json({ data: await adsService.unfavorite(getRequiredParam(req, 'id'), req.user!.id) });
  }

  async report(req: Request, res: Response) {
    res.status(201).json({ data: await adsService.report(getRequiredParam(req, 'id'), req.user!.id, req.body) });
  }
}

export const adsController = new AdsController();
