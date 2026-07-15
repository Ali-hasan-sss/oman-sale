import { RaffleStatus } from '@prisma/client';
import { z } from 'zod';

import { imageReferenceSchema } from '../../shared/utils/media-reference';

const rafflePlanPointsSchema = z.object({
  planId: z.string().uuid(),
  points: z.number().int().min(0)
});

export const createRaffleSchema = z.object({
  titleAr: z.string().trim().min(2),
  titleEn: z.string().trim().min(2),
  descriptionAr: z.string().trim().min(2),
  descriptionEn: z.string().trim().min(2),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  status: z.nativeEnum(RaffleStatus).optional(),
  planPoints: z.array(rafflePlanPointsSchema).min(1)
});

export const updateRaffleSchema = createRaffleSchema.partial();

export type CreateRaffleDto = z.infer<typeof createRaffleSchema>;
export type UpdateRaffleDto = z.infer<typeof updateRaffleSchema>;

export const publishRaffleToHeroSchema = z.object({
  imageUrl: imageReferenceSchema,
  platform: z.enum(['WEB', 'MOBILE', 'ALL']).default('ALL'),
  titleAr: z.string().min(1).max(200).optional(),
  titleEn: z.string().min(1).max(200).optional(),
  subtitleAr: z.string().min(1).max(400).optional(),
  subtitleEn: z.string().min(1).max(400).optional(),
  buttonLabelAr: z.string().min(1).max(80).optional(),
  buttonLabelEn: z.string().min(1).max(80).optional(),
  buttonLink: z.string().min(1).max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).optional()
});

export type PublishRaffleToHeroDto = z.infer<typeof publishRaffleToHeroSchema>;
