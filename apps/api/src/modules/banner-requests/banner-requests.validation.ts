import { BannerRequestStatus } from '@prisma/client';
import { z } from 'zod';

import { imageReferenceSchema } from '../../shared/utils/media-reference';

export const createBannerRequestSchema = z.object({
  imageUrl: imageReferenceSchema,
  linkUrl: z.string().trim().min(1).max(500),
  textAr: z.string().trim().max(200).optional(),
  textEn: z.string().trim().max(200).optional(),
  durationDays: z.coerce.number().int().min(1).max(365)
});

export const updateBannerPricingSchema = z.object({
  pricePerDay: z.coerce.number().positive(),
  minDays: z.coerce.number().int().min(1).max(365).optional(),
  maxDays: z.coerce.number().int().min(1).max(365).optional(),
  isActive: z.boolean().optional()
});

export const listBannerRequestsQuerySchema = z.object({
  status: z.nativeEnum(BannerRequestStatus).optional()
});

export const rejectBannerRequestSchema = z.object({
  reason: z.string().trim().min(3).max(500)
});

export const confirmThawaniBannerPaymentSchema = z.object({
  sessionId: z.string().trim().min(1)
});

export const quoteBannerRequestSchema = z.object({
  durationDays: z.coerce.number().int().min(1).max(365)
});

export type CreateBannerRequestInput = z.infer<typeof createBannerRequestSchema>;
export type UpdateBannerPricingInput = z.infer<typeof updateBannerPricingSchema>;
export type ListBannerRequestsQuery = z.infer<typeof listBannerRequestsQuerySchema>;
export type RejectBannerRequestInput = z.infer<typeof rejectBannerRequestSchema>;
