import type { Request, Response } from 'express';

import { usersService } from './users.service';

export class UsersController {
  async me(req: Request, res: Response) {
    res.json({ data: await usersService.me(req.user!.id) });
  }

  async updateProfile(req: Request, res: Response) {
    res.json({ data: await usersService.updateProfile(req.user!.id, req.body) });
  }

  async changePassword(req: Request, res: Response) {
    res.json({ data: await usersService.changePassword(req.user!.id, req.body) });
  }

  async list(_req: Request, res: Response) {
    res.json({ data: await usersService.list() });
  }
}

export const usersController = new UsersController();
