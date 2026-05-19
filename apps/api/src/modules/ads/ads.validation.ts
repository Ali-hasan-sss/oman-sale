import { AdCondition, AdStatus, AdType } from '@prisma/client';
import { z } from 'zod';

export const omanCities = ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'البريمي', 'الرستاق', 'السيب', 'الخوير', 'القرم'] as const;

const imageUrlSchema = z
  .string()
  .max(1_500_000)
  .refine((value) => value.startsWith('data:image/') || /^https?:\/\//.test(value), {
    message: 'Image must be a URL or data image'
  });

const queryBooleanSchema = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const createAdSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  type: z.nativeEnum(AdType),
  condition: z.nativeEnum(AdCondition).optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().default('OMR'),
  city: z.enum(omanCities),
  area: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contactPhone: z.string().optional(),
  status: z.nativeEnum(AdStatus).default(AdStatus.ACTIVE),
  categoryId: z.string().uuid(),
  imageUrls: z.array(imageUrlSchema).max(8).default([]),
  filterOptionIds: z.array(z.string().uuid()).default([])
});

export const updateAdSchema = createAdSchema.partial();

export const listAdsQuerySchema = z.object({
  q: z.string().optional(),
  type: z.nativeEnum(AdType).optional(),
  status: z.nativeEnum(AdStatus).optional(),
  categoryId: z.string().uuid().optional(),
  city: z.enum(omanCities).optional(),
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

export const adminListAdsQuerySchema = listAdsQuerySchema.extend({
  userId: z.string().uuid().optional(),
  isApproved: queryBooleanSchema.optional(),
  includeDeleted: queryBooleanSchema.optional(),
  deletedOnly: queryBooleanSchema.optional()
});

export const reportAdSchema = z.object({
  reason: z.string().min(5).max(500)
});

export type CreateAdDto = z.infer<typeof createAdSchema>;
export type UpdateAdDto = z.infer<typeof updateAdSchema>;
export type ListAdsQuery = z.infer<typeof listAdsQuerySchema>;
export type AdminListAdsQuery = z.infer<typeof adminListAdsQuerySchema>;
export type ReportAdDto = z.infer<typeof reportAdSchema>;
