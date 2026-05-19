import { PaymentProvider } from '@prisma/client';
import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  provider: z.nativeEnum(PaymentProvider),
  adId: z.string().uuid().optional(),
  promotionId: z.string().uuid().optional()
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
