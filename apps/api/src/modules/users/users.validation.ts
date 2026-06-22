import { z } from 'zod';

import { imageReferenceSchema } from '../../shared/utils/media-reference';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.union([z.string().min(6), z.literal('')]).optional(),
  bio: z.string().max(500).optional(),
  avatar: imageReferenceSchema.nullable().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export const requestEmailChangeSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  locale: z.enum(['ar', 'en']).default('ar')
});

export const verifyEmailChangeSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  code: z.string().regex(/^\d{6}$/)
});

import { verificationChannelSchema } from '../auth/auth.validation';

export const requestPhoneVerificationSchema = z.object({
  phone: z.string().min(6),
  locale: z.enum(['ar', 'en']).default('ar'),
  channel: verificationChannelSchema.optional()
});

export const verifyPhoneSchema = z.object({
  phone: z.string().min(6),
  code: z.string().regex(/^\d{6}$/)
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type RequestEmailChangeDto = z.infer<typeof requestEmailChangeSchema>;
export type VerifyEmailChangeDto = z.infer<typeof verifyEmailChangeSchema>;
export type RequestPhoneVerificationDto = z.infer<typeof requestPhoneVerificationSchema>;
export type VerifyPhoneDto = z.infer<typeof verifyPhoneSchema>;
