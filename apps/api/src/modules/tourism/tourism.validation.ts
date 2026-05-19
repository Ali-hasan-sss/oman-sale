import { z } from 'zod';

const stringArraySchema = z.array(z.string().min(1)).min(1);

export const tourismDestinationSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  sortOrder: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().min(1).max(2000),
  titleAr: z.string().min(1).max(200),
  titleEn: z.string().min(1).max(200),
  rating: z.string().min(1).max(20).default('4.9'),
  ratingLabelAr: z.string().min(1).max(120),
  ratingLabelEn: z.string().min(1).max(120),
  aboutAr: z.string().min(1).max(2000),
  aboutEn: z.string().min(1).max(2000),
  highlightsAr: stringArraySchema,
  highlightsEn: stringArraySchema,
  activitiesAr: stringArraySchema,
  activitiesEn: stringArraySchema,
  bestTimeAr: z.string().min(1).max(300),
  bestTimeEn: z.string().min(1).max(300),
  addressAr: z.string().min(1).max(300),
  addressEn: z.string().min(1).max(300),
  isActive: z.boolean().optional()
});

export const updateTourismDestinationSchema = tourismDestinationSchema.partial();
export const listTourismDestinationsQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional()
});

export type TourismDestinationInput = z.infer<typeof tourismDestinationSchema>;
export type UpdateTourismDestinationInput = z.infer<typeof updateTourismDestinationSchema>;
