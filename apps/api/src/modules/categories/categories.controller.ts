import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { categoriesService } from './categories.service';
import type { CheckCategorySlugQuery, ListAdminCategoriesQuery, ListCategoriesQuery } from './categories.validation';

export class CategoriesController {
  async list(req: Request, res: Response) {
    res.json({ data: await categoriesService.list(req.query as unknown as ListCategoriesQuery) });
  }

  async listForAdmin(req: Request, res: Response) {
    res.json({ data: await categoriesService.listForAdmin(req.query as unknown as ListAdminCategoriesQuery) });
  }

  async checkSlugAvailability(req: Request, res: Response) {
    const query = req.query as unknown as CheckCategorySlugQuery;
    res.json({ data: await categoriesService.checkSlugAvailability(query.slug, query.excludeId) });
  }

  async create(req: Request, res: Response) {
    res.status(201).json({ data: await categoriesService.create(req.body) });
  }

  async update(req: Request, res: Response) {
    res.json({ data: await categoriesService.update(getRequiredParam(req, 'id'), req.body) });
  }

  async delete(req: Request, res: Response) {
    res.json({ data: await categoriesService.delete(getRequiredParam(req, 'id')) });
  }

  async listFilters(req: Request, res: Response) {
    const locale = req.query.locale === 'en' ? 'en' : 'ar';
    const includeInactive = req.query.includeInactive === 'true';
    res.json({ data: await categoriesService.listFilters(getRequiredParam(req, 'id'), locale, includeInactive) });
  }

  async createFilter(req: Request, res: Response) {
    res.status(201).json({ data: await categoriesService.createFilter(getRequiredParam(req, 'id'), req.body) });
  }

  async updateFilter(req: Request, res: Response) {
    res.json({ data: await categoriesService.updateFilter(getRequiredParam(req, 'filterId'), req.body) });
  }

  async deleteFilter(req: Request, res: Response) {
    res.json({ data: await categoriesService.deleteFilter(getRequiredParam(req, 'filterId')) });
  }
}

export const categoriesController = new CategoriesController();
