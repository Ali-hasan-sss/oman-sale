import { z } from 'zod';

export const createPromotionPlanSchema = z.object({
  nameAr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80),
  descriptionAr: z.string().trim().min(2).max(500),
  descriptionEn: z.string().trim().min(2).max(500),
  weekPrice: z.coerce.number().min(0),
  twoWeeksPrice: z.coerce.number().min(0),
  monthPrice: z.coerce.number().min(0),
  priorityScore: z.coerce.number().int().min(0),
  dailyImpressions: z.coerce.number().int().positive(),
  appearsFirst: z.boolean().default(false),
  badgeLabel: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional()
});

export const updatePromotionPlanSchema = createPromotionPlanSchema.partial();

export const promoteAdSchema = z.object({
  adId: z.string().uuid(),
  planId: z.string().uuid(),
  days: z.number().int().positive()
});

export type CreatePromotionPlanDto = z.infer<typeof createPromotionPlanSchema>;
export type UpdatePromotionPlanDto = z.infer<typeof updatePromotionPlanSchema>;
export type PromoteAdDto = z.infer<typeof promoteAdSchema>;
