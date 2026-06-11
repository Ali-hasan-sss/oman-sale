import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const searchSuggestionsQuerySchema = z.object({
  q: z.string().trim().min(4).max(80),
  locale: z.enum(['ar', 'en']).default('ar'),
  limit: z.coerce.number().int().min(1).max(8).default(4)
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchSuggestionsQuery = z.infer<typeof searchSuggestionsQuerySchema>;
