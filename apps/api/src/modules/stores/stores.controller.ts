import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { confirmThawaniStorePayment } from './store-checkout.service';
import { storesService } from './stores.service';
import type { ListStorePlansForCategoryQuery, ListStoresQuery } from './stores.validation';
import type { ListAdsQuery } from '../ads/ads.validation';

const resolveLocale = (req: Request): 'ar' | 'en' => {
  const locale = req.query.locale;
  return locale === 'en' ? 'en' : 'ar';
};

export class StoresController {
  listPlans(req: Request, res: Response) {
    const query = req.query as unknown as ListStorePlansForCategoryQuery;
    const userId = req.user?.id;
    return storesService.listPlansForCategory(query.rootCategoryId, userId).then((data) => res.json({ data }));
  }

  list(req: Request, res: Response) {
    return storesService.list(req.query as unknown as ListStoresQuery).then((data) => res.json({ data }));
  }

  getBySlug(req: Request, res: Response) {
    return storesService.getBySlug(getRequiredParam(req, 'slug')).then((data) => res.json({ data }));
  }

  listAdsBySlug(req: Request, res: Response) {
    return storesService
      .listPublicAdsBySlug(getRequiredParam(req, 'slug'), req.query as unknown as ListAdsQuery)
      .then((data) => res.json({ data }));
  }

  getMine(req: Request, res: Response) {
    return storesService.getMine(req.user!.id).then((data) => res.json({ data }));
  }

  getById(req: Request, res: Response) {
    return storesService.getByIdForOwner(getRequiredParam(req, 'id'), req.user!.id).then((data) => res.json({ data }));
  }

  listAds(req: Request, res: Response) {
    return storesService
      .listAds(getRequiredParam(req, 'id'), req.user!.id, req.query as unknown as ListAdsQuery)
      .then((data) => res.json({ data }));
  }

  listSubscriptions(req: Request, res: Response) {
    return storesService
      .listSubscriptionsForOwner(
        getRequiredParam(req, 'id'),
        req.user!.id,
        req.query as unknown as import('./stores.validation').ListStoreSubscriptionsQuery
      )
      .then((data) => res.json({ data }));
  }

  create(req: Request, res: Response) {
    return storesService.create(req.user!.id, req.body, resolveLocale(req)).then((data) => res.status(201).json({ data }));
  }

  update(req: Request, res: Response) {
    return storesService
      .update(getRequiredParam(req, 'id'), req.user!.id, req.body)
      .then((data) => res.json({ data }));
  }

  activatePaid(req: Request, res: Response) {
    return storesService
      .activatePaid(getRequiredParam(req, 'id'), req.user!.id, resolveLocale(req))
      .then((data) => res.json({ data }));
  }

  subscribe(req: Request, res: Response) {
    return storesService
      .subscribe(getRequiredParam(req, 'id'), req.user!.id, req.body, resolveLocale(req))
      .then((data) => res.status(201).json({ data }));
  }

  renewSubscription(req: Request, res: Response) {
    return storesService
      .renewSubscription(getRequiredParam(req, 'id'), req.user!.id)
      .then((data) => res.json({ data }));
  }

  confirmThawaniPayment(req: Request, res: Response) {
    return confirmThawaniStorePayment(req.user!.id, req.body.sessionId).then((data) => res.json({ data }));
  }

  listForAdmin(req: Request, res: Response) {
    return storesService
      .listForAdmin(req.query as unknown as import('./stores.validation').ListAdminStoresQuery)
      .then((data) => res.json({ data }));
  }

  getByIdForAdmin(req: Request, res: Response) {
    return storesService.getByIdForAdmin(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }

  activateForAdmin(req: Request, res: Response) {
    return storesService.activateForAdmin(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }

  deactivateForAdmin(req: Request, res: Response) {
    return storesService.deactivateForAdmin(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }

  assignPlanForAdmin(req: Request, res: Response) {
    return storesService
      .assignPlanForAdmin(getRequiredParam(req, 'id'), req.body)
      .then((data) => res.json({ data }));
  }

  renewSubscriptionForAdmin(req: Request, res: Response) {
    return storesService
      .renewSubscriptionForAdmin(getRequiredParam(req, 'id'))
      .then((data) => res.json({ data }));
  }

  removeForAdmin(req: Request, res: Response) {
    return storesService.removeForAdmin(getRequiredParam(req, 'id')).then((data) => res.json({ data }));
  }
}

export const storesController = new StoresController();
