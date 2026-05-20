import { CategoryType } from '@prisma/client';
import { z } from 'zod';

export const categoryIconKeys = [
  'baby',
  'bike',
  'book',
  'briefcase',
  'building',
  'car',
  'gamepad',
  'graduation',
  'heart',
  'home',
  'laptop',
  'map-pin',
  'monitor',
  'palette',
  'search',
  'shirt',
  'smartphone',
  'sofa',
  'store',
  'stethoscope',
  'tag',
  'truck',
  'utensils',
  'watch',
  'wrench'
] as const;

export const createCategorySchema = z.object({
  nameAr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  icon: z.enum(categoryIconKeys),
  type: z.nativeEnum(CategoryType),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional()
});

export const updateCategorySchema = createCategorySchema.partial();

export const listCategoriesQuerySchema = z.object({
  locale: z.enum(['ar', 'en']).default('ar'),
  type: z.nativeEnum(CategoryType).optional(),
  includeInactive: z.coerce.boolean().optional()
});

export const listAdminCategoriesQuerySchema = z.object({
  type: z.nativeEnum(CategoryType).optional(),
  page: z.coerce.number().int().positive().default(1),
  all: z.coerce.boolean().optional()
});

export const checkCategorySlugQuerySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excludeId: z.string().uuid().optional()
});

export const createCategoryFilterSchema = z.object({
  titleAr: z.string().trim().min(2).max(80),
  titleEn: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  isActive: z.boolean().optional(),
  options: z
    .array(
      z.object({
        labelAr: z.string().trim().min(1).max(80),
        labelEn: z.string().trim().min(1).max(80),
        slug: z
          .string()
          .trim()
          .min(1)
          .max(100)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          .optional(),
        isActive: z.boolean().optional()
      })
    )
    .min(1)
});

export const updateCategoryFilterSchema = createCategoryFilterSchema.partial().extend({
  options: createCategoryFilterSchema.shape.options.optional()
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
export type ListAdminCategoriesQuery = z.infer<typeof listAdminCategoriesQuerySchema>;
export type CheckCategorySlugQuery = z.infer<typeof checkCategorySlugQuerySchema>;
export type CreateCategoryFilterDto = z.infer<typeof createCategoryFilterSchema>;
export type UpdateCategoryFilterDto = z.infer<typeof updateCategoryFilterSchema>;
