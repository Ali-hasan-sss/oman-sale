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

export const createAdminUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(100),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).default('USER'),
  phone: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().min(6).max(30).nullable().optional()
  ),
  isVerified: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true)
});

export const listAdminReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;
export type UpdateAdminUserDto = z.infer<typeof updateAdminUserSchema>;
export type CreateAdminUserDto = z.infer<typeof createAdminUserSchema>;
export type ListAdminReportsQuery = z.infer<typeof listAdminReportsQuerySchema>;
