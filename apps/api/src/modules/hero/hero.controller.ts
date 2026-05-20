import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { heroService } from './hero.service';
import type { ListAdminHeroSlidesQuery, ListHeroSlidesQuery } from './hero.validation';

export class HeroController {
  async listPublic(req: Request, res: Response) {
    res.json({ data: await heroService.listPublic(req.query as unknown as ListHeroSlidesQuery) });
  }

  async listForAdmin(req: Request, res: Response) {
    res.json({ data: await heroService.listForAdmin(req.query as unknown as ListAdminHeroSlidesQuery) });
  }

  async getById(req: Request, res: Response) {
    res.json({ data: await heroService.getById(getRequiredParam(req, 'id')) });
  }

  async create(req: Request, res: Response) {
    res.status(201).json({ data: await heroService.create(req.body) });
  }

  async update(req: Request, res: Response) {
    res.json({ data: await heroService.update(getRequiredParam(req, 'id'), req.body) });
  }

  async delete(req: Request, res: Response) {
    res.json({ data: await heroService.delete(getRequiredParam(req, 'id')) });
  }

  async listBannersPublic(req: Request, res: Response) {
    res.json({ data: await heroService.listBannersPublic(req.query as unknown as ListHeroSlidesQuery) });
  }

  async listBannersForAdmin(_req: Request, res: Response) {
    res.json({ data: await heroService.listBannersForAdmin() });
  }

  async getBannerById(req: Request, res: Response) {
    res.json({ data: await heroService.getBannerById(getRequiredParam(req, 'id')) });
  }

  async createBanner(req: Request, res: Response) {
    res.status(201).json({ data: await heroService.createBanner(req.body) });
  }

  async updateBanner(req: Request, res: Response) {
    res.json({ data: await heroService.updateBanner(getRequiredParam(req, 'id'), req.body) });
  }

  async deleteBanner(req: Request, res: Response) {
    res.json({ data: await heroService.deleteBanner(getRequiredParam(req, 'id')) });
  }
}

export const heroController = new HeroController();
