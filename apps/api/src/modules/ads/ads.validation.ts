import { AdCondition, AdStatus, AdType } from '@prisma/client';
import { z } from 'zod';

import {
  isWilayahInGovernorate,
  omanGovernorateValues,
  omanWilayahValues
} from '../../shared/constants/oman-locations';
import { imageReferenceSchema, videoReferenceSchema } from '../../shared/utils/media-reference';

const governorateSchema = z.enum(omanGovernorateValues as [string, ...string[]]);
const wilayahSchema = z.enum(omanWilayahValues as [string, ...string[]]);

function validateAdLocation(
  value: { city?: string; wilayah?: string },
  ctx: z.RefinementCtx,
  requireBoth = false
) {
  if (requireBoth) {
    if (!value.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Governorate is required', path: ['city'] });
    }
    if (!value.wilayah) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Wilayah is required', path: ['wilayah'] });
    }
  }

  if (value.city && value.wilayah && !isWilayahInGovernorate(value.city, value.wilayah)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Wilayah does not belong to the selected governorate',
      path: ['wilayah']
    });
  }
}

const queryBooleanSchema = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const createAdSchema = z
  .object({
    title: z.string().min(3),
    description: z.string().min(10),
    type: z.nativeEnum(AdType),
    condition: z.nativeEnum(AdCondition).optional(),
    price: z.number().nonnegative().optional(),
    currency: z.string().default('OMR'),
    city: governorateSchema,
    wilayah: wilayahSchema,
    area: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    contactPhone: z.string().optional(),
    status: z.nativeEnum(AdStatus).default(AdStatus.ACTIVE),
    categoryId: z.string().uuid(),
    storeId: z.string().uuid().optional(),
    videoUrl: videoReferenceSchema.optional().nullable(),
    imageUrls: z.array(imageReferenceSchema).max(8).default([]),
    filterOptionIds: z.array(z.string().uuid()).default([])
  })
  .superRefine((value, ctx) => validateAdLocation(value, ctx, true));

export const updateAdSchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    type: z.nativeEnum(AdType).optional(),
    condition: z.nativeEnum(AdCondition).optional(),
    price: z.number().nonnegative().optional(),
    currency: z.string().optional(),
    city: governorateSchema.optional(),
    wilayah: wilayahSchema.optional(),
    area: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    contactPhone: z.string().optional(),
    status: z.nativeEnum(AdStatus).optional(),
    categoryId: z.string().uuid().optional(),
    storeId: z.string().uuid().optional(),
    videoUrl: videoReferenceSchema.optional().nullable(),
    imageUrls: z.array(imageReferenceSchema).max(8).optional(),
    filterOptionIds: z.array(z.string().uuid()).optional()
  })
  .superRefine((value, ctx) => validateAdLocation(value, ctx));

const listAdsQueryBaseSchema = z.object({
  q: z.string().optional(),
  type: z.nativeEnum(AdType).optional(),
  status: z.nativeEnum(AdStatus).optional(),
  categoryId: z.string().uuid().optional(),
  city: governorateSchema.optional(),
  wilayah: wilayahSchema.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  filterOptionIds: z
    .preprocess((value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',').filter(Boolean);
      return [];
    }, z.array(z.string().uuid()))
    .default([]),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const listAdsQuerySchema = listAdsQueryBaseSchema.superRefine((value, ctx) =>
  validateAdLocation(value, ctx)
);

export const adminListAdsQuerySchema = listAdsQueryBaseSchema
  .extend({
    userId: z.string().uuid().optional(),
    isApproved: queryBooleanSchema.optional(),
    includeDeleted: queryBooleanSchema.optional(),
    deletedOnly: queryBooleanSchema.optional()
  })
  .superRefine((value, ctx) => validateAdLocation(value, ctx));

export const reportAdSchema = z.object({
  reason: z.string().min(5).max(500)
});

export type CreateAdDto = z.infer<typeof createAdSchema>;
export type UpdateAdDto = z.infer<typeof updateAdSchema>;
export type ListAdsQuery = z.infer<typeof listAdsQuerySchema>;
export type AdminListAdsQuery = z.infer<typeof adminListAdsQuerySchema>;
export type ReportAdDto = z.infer<typeof reportAdSchema>;
