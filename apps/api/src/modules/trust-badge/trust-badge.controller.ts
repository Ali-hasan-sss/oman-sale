import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { trustBadgeService } from './trust-badge.service';
import type { ListTrustBadgeQuery } from './trust-badge.validation';

export class TrustBadgeController {
  async getUserMine(req: Request, res: Response) {
    const data = await trustBadgeService.getUserTrustBadge(req.user!.id);
    return res.json({ data });
  }

  async submitUserMine(req: Request, res: Response) {
    const data = await trustBadgeService.submitUserTrustBadge(req.user!.id, req.body);
    return res.status(201).json({ data });
  }

  async getStoreMine(req: Request, res: Response) {
    const data = await trustBadgeService.getStoreTrustBadge(getRequiredParam(req, 'storeId'), req.user!.id);
    return res.json({ data });
  }

  async submitStoreMine(req: Request, res: Response) {
    const data = await trustBadgeService.submitStoreTrustBadge(
      getRequiredParam(req, 'storeId'),
      req.user!.id,
      req.body
    );
    return res.status(201).json({ data });
  }

  async listUsersForAdmin(req: Request, res: Response) {
    const data = await trustBadgeService.listUsersForAdmin(req.query as unknown as ListTrustBadgeQuery);
    return res.json({ data });
  }

  async listStoresForAdmin(req: Request, res: Response) {
    const data = await trustBadgeService.listStoresForAdmin(req.query as unknown as ListTrustBadgeQuery);
    return res.json({ data });
  }

  async approveUser(req: Request, res: Response) {
    const data = await trustBadgeService.approveUser(getRequiredParam(req, 'userId'));
    return res.json({ data });
  }

  async rejectUser(req: Request, res: Response) {
    const data = await trustBadgeService.rejectUser(getRequiredParam(req, 'userId'), req.body);
    return res.json({ data });
  }

  async approveStore(req: Request, res: Response) {
    const data = await trustBadgeService.approveStore(getRequiredParam(req, 'storeId'));
    return res.json({ data });
  }

  async rejectStore(req: Request, res: Response) {
    const data = await trustBadgeService.rejectStore(getRequiredParam(req, 'storeId'), req.body);
    return res.json({ data });
  }

  async countPending(_req: Request, res: Response) {
    const data = await trustBadgeService.countPending();
    return res.json({ data });
  }
}

export const trustBadgeController = new TrustBadgeController();
