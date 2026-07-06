import { ArticleReactionType, ArticleStatus } from '@prisma/client';
import { z } from 'zod';

import { imageReferenceSchema } from '../../shared/utils/media-reference';

const galleryImagesSchema = z.array(imageReferenceSchema).max(12).optional().default([]);

export const articleCategorySchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  nameAr: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

export const updateArticleCategorySchema = articleCategorySchema.partial();

export const articleSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  titleAr: z.string().min(1).max(300),
  titleEn: z.string().min(1).max(300),
  bodyAr: z.string().min(1).max(100_000),
  bodyEn: z.string().min(1).max(100_000),
  coverImageUrl: imageReferenceSchema,
  galleryImages: galleryImagesSchema,
  categoryId: z.string().uuid(),
  status: z.nativeEnum(ArticleStatus).optional(),
  publishedAt: z.coerce.date().optional().nullable()
});

export const updateArticleSchema = articleSchema.partial();

export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().optional(),
  q: z.string().trim().min(1).max(120).optional(),
  includeInactive: z.coerce.boolean().optional()
});

export const latestArticlesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(4)
});

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(500).trim()
});

export const updateCommentSchema = createCommentSchema;

export const reactionSchema = z.object({
  type: z.nativeEnum(ArticleReactionType)
});

export const checkArticleSlugQuerySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  excludeId: z.string().uuid().optional()
});

export const checkArticleCategorySlugQuerySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  excludeId: z.string().uuid().optional()
});

export const idParams = z.object({ id: z.string().uuid() });
export const idOrSlugParams = z.object({ idOrSlug: z.string().min(1) });

export type ArticleCategoryInput = z.infer<typeof articleCategorySchema>;
export type UpdateArticleCategoryInput = z.infer<typeof updateArticleCategorySchema>;
export type ArticleInput = z.infer<typeof articleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;
