import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { rafflesService } from './raffles.service';

export class RafflesController {
  list(req: Request, res: Response) {
    return rafflesService.list(req.query.includeEnded !== 'false').then((data) => res.json({ data }));
  }

  getById(req: Request, res: Response) {
    return rafflesService.getById(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }

  create(req: Request, res: Response) {
    return rafflesService.create(req.body).then((data) => res.status(201).json({ data }));
  }

  update(req: Request, res: Response) {
    return rafflesService.update(getRequiredParam(req, 'id'), req.body).then((data) => res.json({ data }));
  }

  delete(req: Request, res: Response) {
    return rafflesService.delete(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }

  activate(req: Request, res: Response) {
    return rafflesService.activate(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }

  end(req: Request, res: Response) {
    return rafflesService.end(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }

  getHeroPreview(req: Request, res: Response) {
    return rafflesService.getHeroPreview(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }

  publishToHero(req: Request, res: Response) {
    return rafflesService.publishToHero(getRequiredParam(req, 'id'), req.body).then((data) => res.json({ data }));
  }

  unpublishFromHero(req: Request, res: Response) {
    return rafflesService.unpublishFromHero(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }

  getActivePublic(_req: Request, res: Response) {
    return rafflesService.getActivePublic().then((data) => res.json({ data }));
  }
}

export const rafflesController = new RafflesController();
