import { z } from 'zod';

import { createAdSchema } from '../ads/ads.validation';
import { createBannerRequestSchema } from '../banner-requests/banner-requests.validation';

export const paidListingCheckoutSchema = z.object({
  ad: createAdSchema,
  planId: z.string().uuid(),
  days: z.number().int().positive()
});

export const cancelCheckoutPaymentSchema = z.object({
  sessionId: z.string().trim().min(8)
});

export type PaidListingCheckoutDto = z.infer<typeof paidListingCheckoutSchema>;
