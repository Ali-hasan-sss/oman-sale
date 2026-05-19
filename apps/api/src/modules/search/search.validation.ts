import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
