import type { Request, Response } from 'express';

import { categoriesService } from '../categories/categories.service';
import type { CheckCategorySlugQuery, ListAdminCategoriesQuery } from '../categories/categories.validation';
import { getRequiredParam } from '../../shared/utils/request';
import { adminService } from './admin.service';
import type { ListAdminUsersQuery } from './admin.validation';

export class AdminController {
  async statistics(_req: Request, res: Response) {
    res.json({ data: await adminService.statistics() });
  }

  async listUsers(req: Request, res: Response) {
    res.json({ data: await adminService.listUsers(req.query as unknown as ListAdminUsersQuery) });
  }

  async getUser(req: Request, res: Response) {
    res.json({ data: await adminService.getUser(getRequiredParam(req, 'id')) });
  }

  async updateUser(req: Request, res: Response) {
    res.json({ data: await adminService.updateUser(getRequiredParam(req, 'id'), req.body) });
  }

  async listCategories(req: Request, res: Response) {
    res.json({ data: await categoriesService.listForAdmin(req.query as unknown as ListAdminCategoriesQuery) });
  }

  async checkCategorySlug(req: Request, res: Response) {
    const query = req.query as unknown as CheckCategorySlugQuery;
    res.json({ data: await categoriesService.checkSlugAvailability(query.slug, query.excludeId) });
  }

  async createCategory(req: Request, res: Response) {
    res.status(201).json({ data: await categoriesService.create(req.body) });
  }

  async updateCategory(req: Request, res: Response) {
    res.json({ data: await categoriesService.update(getRequiredParam(req, 'id'), req.body) });
  }

  async deleteCategory(req: Request, res: Response) {
    res.json({ data: await categoriesService.delete(getRequiredParam(req, 'id')) });
  }
}

export const adminController = new AdminController();
