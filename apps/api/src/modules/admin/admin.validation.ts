import { AdStatus } from '@prisma/client';
import { z } from 'zod';

export const moderateAdSchema = z.object({
  status: z.enum([AdStatus.ACTIVE, AdStatus.REJECTED]),
  reason: z.string().optional()
});

export const listAdminUsersQuerySchema = z.object({
  q: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const updateAdminUserSchema = z.object({
  isActive: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional()
});

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;
export type UpdateAdminUserDto = z.infer<typeof updateAdminUserSchema>;
