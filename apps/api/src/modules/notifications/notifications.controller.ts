import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { notificationsService } from './notifications.service';

export class NotificationsController {
  async list(req: Request, res: Response) {
    res.json({ data: await notificationsService.listForUser(req.user!.id) });
  }

  async markRead(req: Request, res: Response) {
    res.json({ data: await notificationsService.markRead(getRequiredParam(req, 'id'), req.user!.id) });
  }
}

export const notificationsController = new NotificationsController();
