import { z } from 'zod';

export const registerStartSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  locale: z.enum(['ar', 'en']).default('ar')
});

export const registerPhoneSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(6),
  locale: z.enum(['ar', 'en']).default('ar')
});

export const phoneCodeSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(6),
  code: z.string().regex(/^\d{6}$/)
});

export const registerCompleteSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(8),
  locale: z.enum(['ar', 'en']).default('ar')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export const emailCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/)
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
  locale: z.enum(['ar', 'en']).default('ar')
});

export const forgotPasswordSchema = resendVerificationSchema;

export const resetPasswordSchema = emailCodeSchema.extend({
  password: z.string().min(8)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1)
});

export const completeProfilePhoneSchema = z.object({
  phone: z.string().min(6),
  locale: z.enum(['ar', 'en']).default('ar')
});

export const completeProfilePhoneVerifySchema = z.object({
  phone: z.string().min(6),
  code: z.string().regex(/^\d{6}$/)
});

export const completeProfileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  password: z.string().min(8)
});

/** @deprecated Use registerCompleteSchema */
export const registerSchema = registerCompleteSchema;

export type RegisterStartDto = z.infer<typeof registerStartSchema>;
export type RegisterPhoneDto = z.infer<typeof registerPhoneSchema>;
export type PhoneCodeDto = z.infer<typeof phoneCodeSchema>;
export type RegisterCompleteDto = z.infer<typeof registerCompleteSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type EmailCodeDto = z.infer<typeof emailCodeSchema>;
export type ResendVerificationDto = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;
export type CompleteProfilePhoneDto = z.infer<typeof completeProfilePhoneSchema>;
export type CompleteProfilePhoneVerifyDto = z.infer<typeof completeProfilePhoneVerifySchema>;
export type CompleteProfileDto = z.infer<typeof completeProfileSchema>;
