import { randomUUID } from 'node:crypto';

import { AuthCodePurpose, UserRole } from '@prisma/client';

import { env } from '../../config/env';
import { ErrorCodes } from '../../shared/constants/error-codes';
import { verifyGoogleIdToken } from '../../shared/firebase/firebase-admin';
import { sendAuthCodeEmail } from '../../shared/email/mailer';
import { getUserVerifiedPhone, clearUserVerifiedPhone, normalizePhone, setUserVerifiedPhone } from '../../shared/phone/verified-phone';
import { sendAuthCodeWhatsApp } from '../../shared/whatsapp/send-auth-code';
import { ApiError } from '../../shared/utils/api-error';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/tokens';
import { resolveUserMedia } from '../../shared/utils/resolve-entity-media';
import { authRepository } from './auth.repository';
import type { AuthTokens, AuthUserResponse } from './auth.types';
import {
  clearPendingRegistration,
  getPendingRegistration,
  getResendCooldownRemaining,
  savePendingRegistration,
  setResendCooldown
} from './registration-pending';
import type {
  ChangePasswordDto,
  CompleteProfileDto,
  CompleteProfilePhoneDto,
  CompleteProfilePhoneVerifyDto,
  EmailCodeDto,
  ForgotPasswordDto,
  GoogleAuthDto,
  LoginDto,
  PhoneCodeDto,
  RefreshTokenDto,
  RegisterCompleteDto,
  RegisterPhoneDto,
  RegisterStartDto,
  ResendVerificationDto,
  ResetPasswordDto
} from './auth.validation';

const sanitizeUser = (user: AuthUserResponse): AuthUserResponse =>
  resolveUserMedia({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    profileCompleted: user.profileCompleted
  });

export class AuthService {
  async registerStart(dto: RegisterStartDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await authRepository.findByEmail(email);
    if (existing && !existing.deletedAt) throw new ApiError(409, 'Email is already registered');

    const cooldown = await getResendCooldownRemaining('email', email);
    if (cooldown > 0) {
      throw new ApiError(429, `Please wait ${cooldown} seconds before requesting a new code`, ErrorCodes.RESEND_COOLDOWN);
    }

    await savePendingRegistration(email, {
      fullName: dto.fullName.trim(),
      email,
      emailVerified: false,
      phoneVerified: false
    });

    await this.issueEmailCode(email, AuthCodePurpose.EMAIL_VERIFICATION, dto.locale);
    await setResendCooldown('email', email);

    return { email, codeSent: true };
  }

  async registerVerifyEmail(dto: EmailCodeDto) {
    const email = dto.email.trim().toLowerCase();
    const pending = await getPendingRegistration(email);
    if (!pending) throw new ApiError(400, 'Registration session expired. Please start again.');

    await this.consumeEmailCode(email, dto.code, AuthCodePurpose.EMAIL_VERIFICATION);
    pending.emailVerified = true;
    await savePendingRegistration(email, pending);

    return { verified: true };
  }

  async registerResendEmail(dto: ResendVerificationDto) {
    const email = dto.email.trim().toLowerCase();
    const pending = await getPendingRegistration(email);
    if (!pending) throw new ApiError(400, 'Registration session expired. Please start again.');
    if (pending.emailVerified) return { sent: true };

    const cooldown = await getResendCooldownRemaining('email', email);
    if (cooldown > 0) {
      throw new ApiError(429, `Please wait ${cooldown} seconds before requesting a new code`, ErrorCodes.RESEND_COOLDOWN);
    }

    await this.issueEmailCode(email, AuthCodePurpose.EMAIL_VERIFICATION, dto.locale);
    await setResendCooldown('email', email);

    return { sent: true };
  }

  async registerSendPhoneCode(dto: RegisterPhoneDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();
    const pending = await getPendingRegistration(email);
    if (!pending?.emailVerified) throw new ApiError(400, 'Email verification required');

    const existingPhone = await authRepository.findByPhone(phone);
    if (existingPhone) throw new ApiError(409, 'Phone number is already used');

    const cooldown = await getResendCooldownRemaining('phone', phone);
    if (cooldown > 0) {
      throw new ApiError(429, `Please wait ${cooldown} seconds before requesting a new code`, ErrorCodes.RESEND_COOLDOWN);
    }

    pending.phone = phone;
    pending.phoneVerified = false;
    await savePendingRegistration(email, pending);

    await this.issuePhoneCode(email, phone, dto.locale);
    await setResendCooldown('phone', phone);

    return { sent: true };
  }

  async registerVerifyPhone(dto: PhoneCodeDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();
    const pending = await getPendingRegistration(email);
    if (!pending?.emailVerified) throw new ApiError(400, 'Email verification required');
    if (pending.phone !== phone) throw new ApiError(400, 'Phone number mismatch');

    if (!(env.PHONE_SKIP_VERIFY && dto.code === '000000')) {
      await this.consumePhoneCode(phone, dto.code, AuthCodePurpose.PHONE_VERIFICATION);
    }

    pending.phoneVerified = true;
    await savePendingRegistration(email, pending);

    return { verified: true };
  }

  async registerResendPhone(dto: RegisterPhoneDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();
    const pending = await getPendingRegistration(email);
    if (!pending?.emailVerified) throw new ApiError(400, 'Email verification required');
    if (pending.phoneVerified) return { sent: true };

    const cooldown = await getResendCooldownRemaining('phone', phone);
    if (cooldown > 0) {
      throw new ApiError(429, `Please wait ${cooldown} seconds before requesting a new code`, ErrorCodes.RESEND_COOLDOWN);
    }

    await this.issuePhoneCode(email, phone, dto.locale);
    await setResendCooldown('phone', phone);

    return { sent: true };
  }

  async register(dto: RegisterCompleteDto): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();
    const pending = await getPendingRegistration(email);

    if (!pending?.emailVerified || !pending.phoneVerified) {
      throw new ApiError(400, 'Email and phone verification required');
    }
    if (pending.phone !== phone) throw new ApiError(400, 'Phone number mismatch');

    const existing = await authRepository.findByEmail(email);
    if (existing && !existing.deletedAt) throw new ApiError(409, 'Email is already registered');

    const existingPhone = await authRepository.findByPhone(phone);
    if (existingPhone) throw new ApiError(409, 'Phone number is already used');

    const password = await hashPassword(dto.password);
    const user = await authRepository.createUser({
      fullName: pending.fullName,
      email,
      phone,
      password
    });
    const verifiedUser = await authRepository.verifyUserEmail(user.id);
    await clearPendingRegistration(email);

    return {
      user: sanitizeUser(verifiedUser),
      tokens: await this.createTokens(verifiedUser.id, verifiedUser.email, verifiedUser.role)
    };
  }

  async login(dto: LoginDto): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const user = await authRepository.findByEmail(dto.email);
    if (!user || user.deletedAt) throw new ApiError(401, 'Invalid credentials');
    if (!user.isActive || user.isBlocked) {
      throw new ApiError(
        403,
        'Account is not allowed',
        user.isBlocked ? ErrorCodes.ACCOUNT_BLOCKED : ErrorCodes.ACCOUNT_INACTIVE
      );
    }
    if (!user.isVerified) throw new ApiError(403, 'Email verification required', ErrorCodes.EMAIL_VERIFICATION_REQUIRED);

    const validPassword = await verifyPassword(dto.password, user.password);
    if (!validPassword) throw new ApiError(401, 'Invalid credentials');

    return this.buildAuthResponse(user);
  }

  async googleAuth(dto: GoogleAuthDto): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const googleUser = await verifyGoogleIdToken(dto.idToken);
    let user = await authRepository.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await authRepository.findByEmail(googleUser.email);
      if (user && !user.deletedAt) {
        if (user.googleId && user.googleId !== googleUser.googleId) {
          throw new ApiError(409, 'Email is already linked to another Google account');
        }
        user = await authRepository.linkGoogleAccount(user.id, {
          googleId: googleUser.googleId,
          avatar: googleUser.avatar
        });
      }
    }

    if (!user || user.deletedAt) {
      const password = await hashPassword(randomUUID());
      user = await authRepository.createGoogleUser({
        fullName: googleUser.fullName,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatar: googleUser.avatar,
        password
      });
    }

    if (!user.isActive || user.isBlocked) {
      throw new ApiError(
        403,
        'Account is not allowed',
        user.isBlocked ? ErrorCodes.ACCOUNT_BLOCKED : ErrorCodes.ACCOUNT_INACTIVE
      );
    }

    return this.buildAuthResponse(user);
  }

  async completeProfileSendPhone(userId: string, dto: CompleteProfilePhoneDto) {
    const user = await authRepository.findById(userId);
    if (!user || user.deletedAt) throw new ApiError(404, 'User not found');
    if (user.profileCompleted) throw new ApiError(400, 'Profile is already complete');

    const phone = dto.phone.trim();
    const existingPhone = await authRepository.findByPhone(phone);
    if (existingPhone && existingPhone.id !== userId) throw new ApiError(409, 'Phone number is already used');

    const cooldown = await getResendCooldownRemaining('phone', phone);
    if (cooldown > 0) {
      throw new ApiError(429, `Please wait ${cooldown} seconds before requesting a new code`, ErrorCodes.RESEND_COOLDOWN);
    }

    await this.issuePhoneCode(user.email, phone, dto.locale, userId);
    await setResendCooldown('phone', phone);

    return { sent: true };
  }

  async completeProfileVerifyPhone(userId: string, dto: CompleteProfilePhoneVerifyDto) {
    const user = await authRepository.findById(userId);
    if (!user || user.deletedAt) throw new ApiError(404, 'User not found');
    if (user.profileCompleted) throw new ApiError(400, 'Profile is already complete');

    const phone = dto.phone.trim();
    if (!(env.PHONE_SKIP_VERIFY && dto.code === '000000')) {
      await this.consumePhoneCode(phone, dto.code, AuthCodePurpose.PHONE_VERIFICATION);
    }

    await setUserVerifiedPhone(userId, phone);

    return { verified: true };
  }

  async completeProfile(userId: string, dto: CompleteProfileDto): Promise<{ user: AuthUserResponse }> {
    const user = await authRepository.findById(userId);
    if (!user || user.deletedAt) throw new ApiError(404, 'User not found');
    if (user.profileCompleted) throw new ApiError(400, 'Profile is already complete');

    const phone = dto.phone.trim();
    const verifiedPhone = await getUserVerifiedPhone(userId);
    if (!verifiedPhone || normalizePhone(verifiedPhone) !== normalizePhone(phone)) {
      throw new ApiError(403, 'Phone verification required', ErrorCodes.PHONE_VERIFICATION_REQUIRED);
    }

    const existingPhone = await authRepository.findByPhone(phone);
    if (existingPhone && existingPhone.id !== userId) throw new ApiError(409, 'Phone number is already used');

    const updated = await authRepository.completeUserProfile(userId, {
      fullName: dto.fullName.trim(),
      phone,
      password: await hashPassword(dto.password)
    });
    await clearUserVerifiedPhone(userId);

    return { user: sanitizeUser(updated) };
  }

  async adminLogin(dto: LoginDto): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const result = await this.login(dto);
    if (result.user.role !== UserRole.ADMIN && result.user.role !== UserRole.MODERATOR) {
      throw new ApiError(403, 'Admin access only');
    }

    return result;
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const payload = verifyRefreshToken(dto.refreshToken);
    const activeTokens = await authRepository.findActiveRefreshTokens(payload.sub);

    for (const token of activeTokens) {
      const matches = await verifyPassword(dto.refreshToken, token.tokenHash);
      if (matches) {
        await authRepository.revokeRefreshToken(token.id);
        return this.createTokens(payload.sub, payload.email, payload.role);
      }
    }

    throw new ApiError(401, 'Invalid refresh token');
  }

  async verifyEmail(dto: EmailCodeDto): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const user = await authRepository.findByEmail(dto.email);
    if (!user || user.deletedAt) throw new ApiError(404, 'User not found');
    await this.consumeEmailCode(dto.email, dto.code, AuthCodePurpose.EMAIL_VERIFICATION);
    const verifiedUser = await authRepository.verifyUserEmail(user.id);
    return {
      user: sanitizeUser(verifiedUser),
      tokens: await this.createTokens(verifiedUser.id, verifiedUser.email, verifiedUser.role)
    };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await authRepository.findByEmail(dto.email);
    if (!user || user.deletedAt) throw new ApiError(404, 'User not found');
    if (user.isVerified) return { sent: true };
    await this.issueEmailCode(user.email, AuthCodePurpose.EMAIL_VERIFICATION, dto.locale, user.id);
    return { sent: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await authRepository.findByEmail(dto.email);
    if (user && !user.deletedAt) {
      await this.issueEmailCode(user.email, AuthCodePurpose.PASSWORD_RESET, dto.locale, user.id);
    }
    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await authRepository.findByEmail(dto.email);
    if (!user || user.deletedAt) throw new ApiError(404, 'User not found');
    await this.consumeEmailCode(dto.email, dto.code, AuthCodePurpose.PASSWORD_RESET);
    await authRepository.updatePassword(user.id, await hashPassword(dto.password));
    return { reset: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await authRepository.findById(userId);
    if (!user || user.deletedAt) throw new ApiError(404, 'User not found');

    const validPassword = await verifyPassword(dto.currentPassword, user.password);
    if (!validPassword) throw new ApiError(400, 'Current password is incorrect');

    await authRepository.updatePassword(user.id, await hashPassword(dto.newPassword));
    return { changed: true };
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    phone: string | null;
    avatar: string | null;
    profileCompleted: boolean;
  }): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    return {
      user: sanitizeUser(user),
      tokens: await this.createTokens(user.id, user.email, user.role)
    };
  }

  private generateCode() {
    return env.EMAIL_SKIP_SEND ? env.EMAIL_SKIP_CODE : Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async issueEmailCode(email: string, purpose: AuthCodePurpose, locale: 'ar' | 'en', userId?: string) {
    const code = this.generateCode();
    const codeHash = await hashPassword(code);
    await authRepository.createAuthCode({
      email,
      codeHash,
      purpose,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    await sendAuthCodeEmail(
      email,
      code,
      purpose === AuthCodePurpose.PASSWORD_RESET ? 'reset-password' : 'verify-email',
      locale
    );
  }

  private async issuePhoneCode(email: string, phone: string, locale: 'ar' | 'en', userId?: string) {
    const code = env.PHONE_SKIP_VERIFY ? '000000' : Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await hashPassword(code);
    await authRepository.createAuthCode({
      email,
      phone,
      codeHash,
      purpose: AuthCodePurpose.PHONE_VERIFICATION,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    await sendAuthCodeWhatsApp(phone, code, locale);
  }

  private async consumeEmailCode(email: string, code: string, purpose: AuthCodePurpose) {
    const codes = await authRepository.findActiveAuthCodes(email, purpose);
    for (const item of codes) {
      if (await verifyPassword(code, item.codeHash)) {
        await authRepository.consumeAuthCode(item.id);
        return;
      }
    }
    throw new ApiError(400, 'Invalid or expired verification code');
  }

  private async consumePhoneCode(phone: string, code: string, purpose: AuthCodePurpose) {
    const codes = await authRepository.findActivePhoneAuthCodes(phone, purpose);
    for (const item of codes) {
      if (await verifyPassword(code, item.codeHash)) {
        await authRepository.consumeAuthCode(item.id);
        return;
      }
    }
    throw new ApiError(400, 'Invalid or expired verification code');
  }

  private async createTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const tokens = {
      accessToken: signAccessToken({ userId, email, role }),
      refreshToken: signRefreshToken({ userId, email, role })
    };
    const tokenHash = await hashPassword(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await authRepository.createRefreshToken(userId, tokenHash, expiresAt);
    return tokens;
  }
}

export const authService = new AuthService();
