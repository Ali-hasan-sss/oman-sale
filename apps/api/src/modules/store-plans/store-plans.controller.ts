import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { storePlansService } from './store-plans.service';
import type { ListStorePlansQuery } from './store-plans.validation';

export class StorePlansController {
  list(req: Request, res: Response) {
    return storePlansService.list(req.query as unknown as ListStorePlansQuery).then((data) => res.json({ data }));
  }

  getById(req: Request, res: Response) {
    return storePlansService.getById(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }

  create(req: Request, res: Response) {
    return storePlansService.create(req.body).then((data) => res.status(201).json({ data }));
  }

  update(req: Request, res: Response) {
    return storePlansService.update(getRequiredParam(req, 'id'), req.body).then((data) => res.json({ data }));
  }

  remove(req: Request, res: Response) {
    return storePlansService.remove(getRequiredParam(req, 'id')).then(() => res.status(204).send());
  }

  upsertPricing(req: Request, res: Response) {
    return storePlansService
      .upsertPricing(getRequiredParam(req, 'id'), req.body)
      .then((data) => res.json({ data }));
  }

  bulkUpsertPricing(req: Request, res: Response) {
    return storePlansService
      .bulkUpsertPricing(getRequiredParam(req, 'id'), req.body)
      .then((data) => res.json({ data }));
  }

  async updatePlanDiscount(req: Request, res: Response) {
    return storePlansService
      .updatePlanDiscount(getRequiredParam(req, 'id'), req.body)
      .then((data) => res.json({ data }));
  }

  updateDiscount(req: Request, res: Response) {
    return storePlansService
      .updateDiscount(getRequiredParam(req, 'pricingId'), req.body)
      .then((data) => res.json({ data }));
  }

  removePricing(req: Request, res: Response) {
    return storePlansService.removePricing(getRequiredParam(req, 'pricingId')).then(() => res.status(204).send());
  }
}

export const storePlansController = new StorePlansController();
