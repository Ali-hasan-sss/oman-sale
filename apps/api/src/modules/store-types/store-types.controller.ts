import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { storeTypesService } from './store-types.service';

export class StoreTypesController {
  async listPublic(_req: Request, res: Response) {
    res.json({ data: await storeTypesService.listPublic() });
  }

  async listForAdmin(_req: Request, res: Response) {
    res.json({ data: await storeTypesService.listForAdmin() });
  }

  async getById(req: Request, res: Response) {
    res.json({ data: await storeTypesService.getById(getRequiredParam(req, 'id')) });
  }

  async create(req: Request, res: Response) {
    res.status(201).json({ data: await storeTypesService.create(req.body) });
  }

  async update(req: Request, res: Response) {
    res.json({ data: await storeTypesService.update(getRequiredParam(req, 'id'), req.body) });
  }

  async delete(req: Request, res: Response) {
    res.json({ data: await storeTypesService.delete(getRequiredParam(req, 'id')) });
  }
}

export const storeTypesController = new StoreTypesController();
