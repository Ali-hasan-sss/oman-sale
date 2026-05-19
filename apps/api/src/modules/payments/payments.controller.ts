import type { Request, Response } from 'express';

import { paymentsService } from './payments.service';

export class PaymentsController {
  async list(req: Request, res: Response) {
    res.json({ data: await paymentsService.listForUser(req.user!.id) });
  }

  async create(req: Request, res: Response) {
    res.status(201).json({ data: await paymentsService.create(req.user!.id, req.body) });
  }
}

export const paymentsController = new PaymentsController();
