import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { notificationsService } from './notifications.service';

class NotificationsController {
  async list(req: Request, res: Response) {
    res.json({ data: await notificationsService.listForUser(req.user!.id) });
  }

  async unreadCount(req: Request, res: Response) {
    const count = await notificationsService.unreadCount(req.user!.id);
    res.json({ data: { count } });
  }

  async registerPushToken(req: Request, res: Response) {
    const { token, platform } = req.body as { token: string; platform: Parameters<typeof notificationsService.registerPushToken>[2] };
    res.json({ data: await notificationsService.registerPushToken(req.user!.id, token, platform) });
  }

  async removePushToken(req: Request, res: Response) {
    const { token } = req.body as { token: string };
    await notificationsService.removePushToken(req.user!.id, token);
    res.json({ data: { removed: true } });
  }

  async markRead(req: Request, res: Response) {
    res.json({ data: await notificationsService.markRead(getRequiredParam(req, 'id'), req.user!.id) });
  }

  async markAllRead(req: Request, res: Response) {
    res.json({ data: await notificationsService.markAllRead(req.user!.id) });
  }
}

export const notificationsController = new NotificationsController();
