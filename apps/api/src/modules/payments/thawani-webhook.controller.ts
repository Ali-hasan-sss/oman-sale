import type { Request, Response } from 'express';

import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/api-error';
import type { ThawaniWebhookEvent } from '../../shared/payments/thawani.client';
import { verifyThawaniWebhookSignature } from '../../shared/payments/thawani.client';
import { handleThawaniWebhookEvent } from '../../shared/payments/thawani-webhook.service';

function getHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export class ThawaniWebhookController {
  async handle(req: Request, res: Response) {
    const rawBody = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';

    if (!rawBody) {
      throw new ApiError(400, 'Empty webhook body');
    }

    const timestamp = getHeaderValue(req.headers['thawani-timestamp']);
    const signature = getHeaderValue(req.headers['thawani-signature']);

    if (env.THAWANI_WEBHOOK_SECRET) {
      if (!timestamp || !signature) {
        throw new ApiError(401, 'Missing Thawani webhook signature headers');
      }

      const valid = verifyThawaniWebhookSignature(rawBody, timestamp, signature);
      if (!valid) {
        throw new ApiError(401, 'Invalid Thawani webhook signature');
      }
    } else if (env.NODE_ENV === 'production') {
      throw new ApiError(503, 'Thawani webhook secret is not configured');
    }

    const event = JSON.parse(rawBody) as ThawaniWebhookEvent;
    const result = await handleThawaniWebhookEvent(event);

    res.json({ received: true, ...result });
  }
}

export const thawaniWebhookController = new ThawaniWebhookController();
