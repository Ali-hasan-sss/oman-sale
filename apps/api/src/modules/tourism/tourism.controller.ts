import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { tourismService } from './tourism.service';

export class TourismController {
  async list(req: Request, res: Response) {
    res.json({ data: await tourismService.list(req.query.includeInactive === 'true') });
  }

  async get(req: Request, res: Response) {
    res.json({ data: await tourismService.get(getRequiredParam(req, 'idOrSlug')) });
  }

  async create(req: Request, res: Response) {
    res.status(201).json({ data: await tourismService.create(req.body) });
  }

  async update(req: Request, res: Response) {
    res.json({ data: await tourismService.update(getRequiredParam(req, 'id'), req.body) });
  }

  async delete(req: Request, res: Response) {
    res.json({ data: await tourismService.delete(getRequiredParam(req, 'id')) });
  }
}

export const tourismController = new TourismController();
