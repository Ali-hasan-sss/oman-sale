import { StoreBillingPeriod } from '@prisma/client';
import { z } from 'zod';

import { omanCities } from '../../shared/constants/oman-cities';

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

const storeImageSchema = z
  .string()
  .max(1_500_000)
  .refine((value) => value.startsWith('data:image/') || /^https?:\/\//.test(value), {
    message: 'Image must be a URL or data image'
  });

export const createStoreSchema = z.object({
  nameAr: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  bioAr: z.string().trim().max(2000).optional(),
  bioEn: z.string().trim().max(2000).optional(),
  logoUrl: storeImageSchema.optional(),
  coverUrl: storeImageSchema.optional(),
  phone: z.string().trim().min(6).max(20).optional(),
  nationalId: z.string().trim().min(5).max(20),
  commercialRegistrationNumber: z.string().trim().min(3).max(30),
  workingHours: storeWorkingHoursSchema,
  rootCategoryId: z.string().uuid(),
  storeTypeId: z.string().uuid(),
  city: z.enum(omanCities),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  planId: z.string().uuid(),
  billingPeriod: z.nativeEnum(StoreBillingPeriod)
});

export const updateStoreSchema = createStoreSchema
  .omit({ planId: true, billingPeriod: true, rootCategoryId: true })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    storeTypeId: z.string().uuid().optional(),
    city: z.enum(omanCities).optional()
  });

export const subscribeStoreSchema = z.object({
  planId: z.string().uuid(),
  billingPeriod: z.nativeEnum(StoreBillingPeriod)
});

export const listStoresQuerySchema = z.object({
  rootCategoryId: z.string().uuid().optional(),
  storeTypeId: z.string().uuid().optional(),
  city: z.enum(omanCities).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20)
});

export const listAdminStoresQuerySchema = z.object({
  q: z.string().trim().optional(),
  rootCategoryId: z.string().uuid().optional(),
  storeTypeId: z.string().uuid().optional(),
  city: z.enum(omanCities).optional(),
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
