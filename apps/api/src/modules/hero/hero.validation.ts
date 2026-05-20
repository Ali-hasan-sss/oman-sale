import { z } from 'zod';

export const listHeroSlidesQuerySchema = z.object({
  locale: z.enum(['ar', 'en']).optional(),
  platform: z.enum(['web', 'mobile']).optional()
});

export const listAdminHeroSlidesQuerySchema = z.object({
  platform: z.enum(['WEB', 'MOBILE']).optional()
});

export const createHeroSlideSchema = z.object({
  sortOrder: z.coerce.number().int().min(0).optional(),
  platform: z.enum(['WEB', 'MOBILE']).default('WEB'),
  imageUrl: z.string().min(1).max(2000),
  titleAr: z.string().min(1).max(200),
  titleEn: z.string().min(1).max(200),
  subtitleAr: z.string().min(1).max(400),
  subtitleEn: z.string().min(1).max(400),
  buttonLabelAr: z.string().min(1).max(80),
  buttonLabelEn: z.string().min(1).max(80),
  buttonLink: z.string().min(1).max(500),
  isActive: z.boolean().optional()
});

export const updateHeroSlideSchema = z.object({
  sortOrder: z.coerce.number().int().min(0).optional(),
  platform: z.enum(['WEB', 'MOBILE']).optional(),
  imageUrl: z.string().min(1).max(2000).optional(),
  titleAr: z.string().min(1).max(200).optional(),
  titleEn: z.string().min(1).max(200).optional(),
  subtitleAr: z.string().min(1).max(400).optional(),
  subtitleEn: z.string().min(1).max(400).optional(),
  buttonLabelAr: z.string().min(1).max(80).optional(),
  buttonLabelEn: z.string().min(1).max(80).optional(),
  buttonLink: z.string().min(1).max(500).optional(),
  isActive: z.boolean().optional()
});

export const createHeroBannerSchema = z.object({
  sortOrder: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().min(1).max(2000),
  textAr: z.string().max(200).optional().nullable(),
  textEn: z.string().max(200).optional().nullable(),
  linkUrl: z.string().min(1).max(2000),
  isActive: z.boolean().optional()
});

export const updateHeroBannerSchema = createHeroBannerSchema.partial();

export type CreateHeroSlideInput = z.infer<typeof createHeroSlideSchema>;
export type UpdateHeroSlideInput = z.infer<typeof updateHeroSlideSchema>;
export type ListHeroSlidesQuery = z.infer<typeof listHeroSlidesQuerySchema>;
export type ListAdminHeroSlidesQuery = z.infer<typeof listAdminHeroSlidesQuerySchema>;
export type CreateHeroBannerInput = z.infer<typeof createHeroBannerSchema>;
export type UpdateHeroBannerInput = z.infer<typeof updateHeroBannerSchema>;
