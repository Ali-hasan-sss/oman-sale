import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { legalService } from './legal.service';
import type { UpsertLegalDocumentInput } from './legal.validation';

function resolveLocale(req: Request): 'ar' | 'en' {
  const locale = typeof req.query.locale === 'string' ? req.query.locale : 'ar';
  return locale === 'en' ? 'en' : 'ar';
}

export class LegalController {
  async getPublic(req: Request, res: Response) {
    const kind = getRequiredParam(req, 'kind') as 'terms' | 'privacy' | 'refund';
    res.json({ data: await legalService.getPublic(kind, resolveLocale(req)) });
  }

  async listForAdmin(_req: Request, res: Response) {
    res.json({ data: await legalService.listForAdmin() });
  }

  async upsertForAdmin(req: Request, res: Response) {
    const kind = getRequiredParam(req, 'kind') as 'terms' | 'privacy' | 'refund';
    res.json({ data: await legalService.upsertForAdmin(kind, req.body as UpsertLegalDocumentInput) });
  }
}

export const legalController = new LegalController();
