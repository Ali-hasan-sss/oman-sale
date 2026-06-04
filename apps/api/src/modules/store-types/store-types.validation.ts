import { z } from 'zod';

export const createStoreTypeSchema = z.object({
  nameAr: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  icon: z.string().trim().max(40).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

export const updateStoreTypeSchema = createStoreTypeSchema.partial();

export type CreateStoreTypeInput = z.infer<typeof createStoreTypeSchema>;
export type UpdateStoreTypeInput = z.infer<typeof updateStoreTypeSchema>;
