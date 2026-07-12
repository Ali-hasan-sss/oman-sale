import type { Request, Response } from 'express';

import { env } from '../../config/env';
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
      res.status(200).json({ received: true, handled: false, reason: 'empty_body' });
      return;
    }

    const timestamp = getHeaderValue(req.headers['thawani-timestamp']);
    const signature = getHeaderValue(req.headers['thawani-signature']);

    if (env.THAWANI_WEBHOOK_SECRET) {
      if (!timestamp || !signature) {
        console.warn('[thawani-webhook] missing signature headers');
        res.status(200).json({ received: true, handled: false, reason: 'missing_signature_headers' });
        return;
      }

      const valid = verifyThawaniWebhookSignature(rawBody, timestamp, signature);
      if (!valid) {
        console.warn('[thawani-webhook] invalid signature');
        res.status(200).json({ received: true, handled: false, reason: 'invalid_signature' });
        return;
      }
    }

    let event: ThawaniWebhookEvent;
    try {
      event = JSON.parse(rawBody) as ThawaniWebhookEvent;
    } catch (error) {
      console.error('[thawani-webhook] invalid json body', error);
      res.status(200).json({ received: true, handled: false, reason: 'invalid_json' });
      return;
    }

    const result = await handleThawaniWebhookEvent(event);
    res.status(200).json({ received: true, ...result });
  }
}

export const thawaniWebhookController = new ThawaniWebhookController();
