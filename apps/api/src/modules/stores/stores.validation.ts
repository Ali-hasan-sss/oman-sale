import { StoreBillingPeriod, StoreBusinessType } from '@prisma/client';
import { z } from 'zod';

import { imageReferenceSchema } from '../../shared/utils/media-reference';
import {
  isWilayahInGovernorate,
  omanGovernorateValues,
  omanWilayahValues
} from '../../shared/constants/oman-locations';

const governorateSchema = z.enum(omanGovernorateValues as [string, ...string[]]);
const wilayahSchema = z.enum(omanWilayahValues as [string, ...string[]]);

function validateStoreBusinessType(
  value: {
    businessType?: StoreBusinessType;
    commercialRegistrationNumber?: string;
  },
  ctx: z.RefinementCtx,
  requireType = false
) {
  if (requireType && !value.businessType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Store business type is required',
      path: ['businessType']
    });
    return;
  }

  if (value.businessType === StoreBusinessType.COMMERCIAL) {
    const cr = value.commercialRegistrationNumber?.trim();
    if (!cr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Commercial registration number is required for commercial stores',
        path: ['commercialRegistrationNumber']
      });
    }
  }
}

function validateStoreLocation(
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

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export const storeWorkingHoursDaySchema = z.object({
  closed: z.boolean().optional(),
  open: z.string().regex(timePattern).optional(),
  close: z.string().regex(timePattern).optional()
});

export const storeWorkingHoursSchema = z
  .record(z.enum(dayKeys), storeWorkingHoursDaySchema)
  .optional();

export const createStoreSchema = z.object({
  nameAr: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  bioAr: z.string().trim().max(2000).optional(),
  bioEn: z.string().trim().max(2000).optional(),
  logoUrl: imageReferenceSchema.optional(),
  coverUrl: imageReferenceSchema.optional(),
  phone: z.string().trim().min(6).max(20).optional(),
  nationalId: z.string().trim().min(5).max(20),
  businessType: z.nativeEnum(StoreBusinessType),
  commercialRegistrationNumber: z.string().trim().min(3).max(30).optional(),
  workingHours: storeWorkingHoursSchema,
  rootCategoryId: z.string().uuid(),
  storeTypeId: z.string().uuid(),
  city: governorateSchema,
  wilayah: wilayahSchema,
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  planId: z.string().uuid(),
  billingPeriod: z.nativeEnum(StoreBillingPeriod)
})
  .superRefine((value, ctx) => validateStoreLocation(value, ctx, true))
  .superRefine((value, ctx) => validateStoreBusinessType(value, ctx, true));

export const updateStoreSchema = z
  .object({
    nameAr: z.string().trim().min(2).max(120).optional(),
    nameEn: z.string().trim().min(2).max(120).optional(),
    bioAr: z.string().trim().max(2000).optional(),
    bioEn: z.string().trim().max(2000).optional(),
    logoUrl: imageReferenceSchema.optional(),
    coverUrl: imageReferenceSchema.optional(),
    phone: z.string().trim().min(6).max(20).optional(),
    nationalId: z.string().trim().min(5).max(20).optional(),
    businessType: z.nativeEnum(StoreBusinessType).optional(),
    commercialRegistrationNumber: z.string().trim().min(3).max(30).optional(),
    workingHours: storeWorkingHoursSchema,
    storeTypeId: z.string().uuid().optional(),
    city: governorateSchema.optional(),
    wilayah: wilayahSchema.optional(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    isActive: z.boolean().optional()
  })
  .superRefine((value, ctx) => validateStoreLocation(value, ctx))
  .superRefine((value, ctx) => validateStoreBusinessType(value, ctx));

export const subscribeStoreSchema = z.object({
  planId: z.string().uuid(),
  billingPeriod: z.nativeEnum(StoreBillingPeriod)
});

export const listStoresQuerySchema = z.object({
  rootCategoryId: z.string().uuid().optional(),
  storeTypeId: z.string().uuid().optional(),
  city: governorateSchema.optional(),
  wilayah: wilayahSchema.optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20)
});

export const listAdminStoresQuerySchema = z.object({
  q: z.string().trim().optional(),
  rootCategoryId: z.string().uuid().optional(),
  storeTypeId: z.string().uuid().optional(),
  city: governorateSchema.optional(),
  wilayah: wilayahSchema.optional(),
  isActive: z
    .preprocess((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    }, z.boolean())
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const adminAssignStorePlanSchema = subscribeStoreSchema;

export const listStorePlansForCategoryQuerySchema = z.object({
  rootCategoryId: z.string().uuid()
});

export const confirmThawaniPaymentSchema = z.object({
  sessionId: z.string().trim().min(8)
});

export type CreateStoreDto = z.infer<typeof createStoreSchema>;
export type UpdateStoreDto = z.infer<typeof updateStoreSchema>;
export type SubscribeStoreDto = z.infer<typeof subscribeStoreSchema>;
export type ListStoresQuery = z.infer<typeof listStoresQuerySchema>;
export type ListAdminStoresQuery = z.infer<typeof listAdminStoresQuerySchema>;
export type AdminAssignStorePlanDto = z.infer<typeof adminAssignStorePlanSchema>;
export type ListStorePlansForCategoryQuery = z.infer<typeof listStorePlansForCategoryQuerySchema>;
