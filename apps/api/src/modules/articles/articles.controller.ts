import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { getViewerContext } from '../../shared/utils/viewer-context';
import { articlesService } from './articles.service';

export class ArticlesController {
  async listCategories(req: Request, res: Response) {
    const includeInactive = String(req.query.includeInactive) === 'true';
    res.json({ data: await articlesService.listCategories(includeInactive) });
  }

  async createCategory(req: Request, res: Response) {
    res.status(201).json({ data: await articlesService.createCategory(req.body) });
  }

  async updateCategory(req: Request, res: Response) {
    res.json({ data: await articlesService.updateCategory(getRequiredParam(req, 'id'), req.body) });
  }

  async deleteCategory(req: Request, res: Response) {
    res.json({ data: await articlesService.deleteCategory(getRequiredParam(req, 'id')) });
  }

  async list(req: Request, res: Response) {
    res.json({ data: await articlesService.list(req.query as never) });
  }

  async listForAdmin(req: Request, res: Response) {
    const query = req.query as { page?: string; limit?: string; categoryId?: string; categorySlug?: string };
    res.json({
      data: await articlesService.list(
        {
          page: Number(query.page) || 1,
          limit: Number(query.limit) || 20,
          categoryId: query.categoryId,
          categorySlug: query.categorySlug
        },
        { admin: true }
      )
    });
  }

  async latest(req: Request, res: Response) {
    res.json({ data: await articlesService.listLatest(Number(req.query.limit) || 4) });
  }

  async get(req: Request, res: Response) {
    res.json({
      data: await articlesService.get(getRequiredParam(req, 'idOrSlug'), getViewerContext(req))
    });
  }

  async getForAdmin(req: Request, res: Response) {
    res.json({
      data: await articlesService.get(getRequiredParam(req, 'idOrSlug'), undefined, { admin: true })
    });
  }

  async create(req: Request, res: Response) {
    res.status(201).json({ data: await articlesService.create(req.body) });
  }

  async update(req: Request, res: Response) {
    res.json({ data: await articlesService.update(getRequiredParam(req, 'id'), req.body) });
  }

  async delete(req: Request, res: Response) {
    res.json({ data: await articlesService.delete(getRequiredParam(req, 'id')) });
  }

  async saves(req: Request, res: Response) {
    res.json({ data: await articlesService.listSaves(req.user!.id) });
  }

  async saveIds(req: Request, res: Response) {
    res.json({ data: await articlesService.listSaveIds(req.user!.id) });
  }

  async save(req: Request, res: Response) {
    res.status(201).json({ data: await articlesService.save(getRequiredParam(req, 'id'), req.user!.id) });
  }

  async unsave(req: Request, res: Response) {
    res.json({ data: await articlesService.unsave(getRequiredParam(req, 'id'), req.user!.id) });
  }

  async listComments(req: Request, res: Response) {
    const query = req.query as unknown as { page: number; limit: number };
    res.json({
      data: await articlesService.listComments(getRequiredParam(req, 'id'), query.page, query.limit)
    });
  }

  async createComment(req: Request, res: Response) {
    res.status(201).json({
      data: await articlesService.createComment(getRequiredParam(req, 'id'), req.user!.id, req.body.body)
    });
  }

  async updateComment(req: Request, res: Response) {
    res.json({
      data: await articlesService.updateComment(getRequiredParam(req, 'commentId'), req.user!.id, req.body.body)
    });
  }

  async deleteComment(req: Request, res: Response) {
    res.json({ data: await articlesService.deleteComment(getRequiredParam(req, 'commentId'), req.user!.id) });
  }

  async getReactions(req: Request, res: Response) {
    res.json({
      data: await articlesService.getReactions(getRequiredParam(req, 'id'), req.user?.id)
    });
  }

  async setReaction(req: Request, res: Response) {
    res.json({
      data: await articlesService.setReaction(getRequiredParam(req, 'id'), req.user!.id, req.body.type)
    });
  }

  async removeReaction(req: Request, res: Response) {
    res.json({
      data: await articlesService.removeReaction(getRequiredParam(req, 'id'), req.user!.id)
    });
  }
}

export const articlesController = new ArticlesController();
