import { StoreBillingPeriod, StoreDiscountType } from '@prisma/client';
import { z } from 'zod';

const storePlanBaseSchema = z.object({
  nameAr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80),
  descriptionAr: z.string().trim().min(2).max(2000),
  descriptionEn: z.string().trim().min(2).max(2000),
  sortOrder: z.coerce.number().int().min(0).optional(),
  trialDays: z.coerce.number().int().min(0).max(365).optional(),
  trialMaxListings: z.coerce.number().int().min(0).max(10000).optional(),
  promotionPlanId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional()
});

export const createStorePlanSchema = storePlanBaseSchema.superRefine((data, ctx) => {
  const trialDays = data.trialDays ?? 0;
  const trialMaxListings = data.trialMaxListings ?? 0;
  if (trialDays > 0 && trialMaxListings <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Trial max listings is required when trial days is greater than zero',
      path: ['trialMaxListings']
    });
  }
});

export const updateStorePlanSchema = storePlanBaseSchema.partial();

export const upsertStorePlanPricingSchema = z.object({
  categoryId: z.string().uuid(),
  billingPeriod: z.nativeEnum(StoreBillingPeriod),
  price: z.coerce.number().min(0),
  maxListings: z.coerce.number().int().positive()
});

export const bulkUpsertStorePlanPricingSchema = z.object({
  categoryId: z.string().uuid(),
  monthlyPrice: z.coerce.number().min(0),
  monthlyMaxListings: z.coerce.number().int().positive(),
  yearlyPrice: z.coerce.number().min(0),
  yearlyMaxListings: z.coerce.number().int().positive()
});

export const updateStorePlanDiscountSchema = z
  .object({
    discountType: z.nativeEnum(StoreDiscountType).optional(),
    discountValue: z.coerce.number().min(0).optional(),
    isDiscountActive: z.boolean().optional()
  })
  .refine(
    (value) =>
      value.discountType !== undefined ||
      value.discountValue !== undefined ||
      value.isDiscountActive !== undefined,
    { message: 'At least one discount field is required' }
  );

export const listStorePlansQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  includeInactive: z.coerce.boolean().optional()
});

export type CreateStorePlanDto = z.infer<typeof createStorePlanSchema>;
export type UpdateStorePlanDto = z.infer<typeof updateStorePlanSchema>;
export type UpsertStorePlanPricingDto = z.infer<typeof upsertStorePlanPricingSchema>;
export type BulkUpsertStorePlanPricingDto = z.infer<typeof bulkUpsertStorePlanPricingSchema>;
export type UpdateStorePlanDiscountDto = z.infer<typeof updateStorePlanDiscountSchema>;
export type ListStorePlansQuery = z.infer<typeof listStorePlansQuerySchema>;
