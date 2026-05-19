import { z } from 'zod';

const avatarSchema = z
  .string()
  .max(1_500_000)
  .refine((value) => value.startsWith('data:image/') || /^https?:\/\//.test(value), {
    message: 'Avatar must be an image URL or data image'
  });

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.union([z.string().min(6), z.literal('')]).optional(),
  bio: z.string().max(500).optional(),
  avatar: avatarSchema.nullable().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
