import type { Request, Response } from 'express';

import { checkoutService } from './checkout.service';

const resolveLocale = (req: Request): 'ar' | 'en' => (req.query.locale === 'en' ? 'en' : 'ar');

export class CheckoutController {
  startPaidListing(req: Request, res: Response) {
    return checkoutService
      .startPaidListingCheckout(req.user!.id, req.body, resolveLocale(req))
      .then((data) => res.status(201).json({ data }));
  }
}

export const checkoutController = new CheckoutController();
