import { AuthCodePurpose, Prisma } from '@prisma/client';

import { env } from '../../config/env';
import { ErrorCodes } from '../../shared/constants/error-codes';
import { sendAuthCodeEmail } from '../../shared/email/mailer';
import { sendAuthCodeWhatsApp } from '../../shared/whatsapp/send-auth-code';
import { getResendCooldownRemaining, setResendCooldown } from '../auth/registration-pending';
import { normalizePhone, setUserVerifiedPhone, getUserVerifiedPhone } from '../../shared/phone/verified-phone';
import { ApiError } from '../../shared/utils/api-error';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { signAccessToken, signRefreshToken } from '../../shared/utils/tokens';
import { authRepository } from '../auth/auth.repository';
import type { AuthTokens } from '../auth/auth.types';
import { resolveUserMedia } from '../../shared/utils/resolve-entity-media';
import { usersRepository } from './users.repository';
import type {
  ChangePasswordDto,
  RequestEmailChangeDto,
  RequestPhoneVerificationDto,
  UpdateProfileDto,
  VerifyEmailChangeDto,
  VerifyPhoneDto
} from './users.validation';

export class UsersService {
  async me(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return resolveUserMedia(user);
  }

  list() {
    return usersRepository.list();
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    try {
      const updated = await usersRepository.updateProfile(userId, dto);
      return resolveUserMedia(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiError(409, 'Phone number is already used');
      }

      throw error;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await usersRepository.findByIdWithPassword(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const isCurrentPasswordValid = await verifyPassword(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) throw new ApiError(400, 'Current password is incorrect');

    const password = await hashPassword(dto.newPassword);
    await usersRepository.updatePassword(userId, password);
    return { changed: true };
  }

  async requestEmailChange(userId: string, dto: RequestEmailChangeDto) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.email === dto.email) return { sent: true };

    const existing = await authRepository.findByEmail(dto.email);
    if (existing && !existing.deletedAt) throw new ApiError(409, 'Email is already registered');

    await this.issueEmailChangeCode(dto.email, dto.locale, userId);
    return { sent: true };
  }

  async verifyEmailChange(userId: string, dto: VerifyEmailChangeDto) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const existing = await authRepository.findByEmail(dto.email);
    if (existing && existing.id !== userId && !existing.deletedAt) {
      throw new ApiError(409, 'Email is already registered');
    }

    await this.consumeEmailChangeCode(userId, dto.email, dto.code);
    const updatedUser = await usersRepository.updateEmail(userId, dto.email);
    return {
      user: updatedUser,
      tokens: await this.createTokens(updatedUser.id, updatedUser.email, updatedUser.role)
    };
  }

  async requestPhoneVerification(userId: string, dto: RequestPhoneVerificationDto) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const phone = normalizePhone(dto.phone.trim());
    if (user.phone && normalizePhone(user.phone) === phone) {
      return { sent: true, alreadyOwned: true };
    }

    const existingPhone = await authRepository.findByPhone(phone);
    if (existingPhone && existingPhone.id !== userId) {
      throw new ApiError(409, 'Phone number is already used');
    }

    const cooldown = await getResendCooldownRemaining('phone', phone);
    if (cooldown > 0) {
      throw new ApiError(429, `Please wait ${cooldown} seconds before requesting a new code`, ErrorCodes.RESEND_COOLDOWN);
    }

    await this.issuePhoneVerificationCode(user.email, phone, dto.locale, userId);
    await setResendCooldown('phone', phone);

    return { sent: true };
  }

  async verifyPhone(userId: string, dto: VerifyPhoneDto) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const phone = normalizePhone(dto.phone.trim());
    if (user.phone && normalizePhone(user.phone) === phone) {
      return { verified: true };
    }

    if (!(env.PHONE_SKIP_VERIFY && dto.code === '000000')) {
      await this.consumePhoneVerificationCode(phone, dto.code, userId);
    }

    await setUserVerifiedPhone(userId, phone);
    return { verified: true };
  }

  async assertPhoneVerifiedForAction(userId: string, phone: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const normalizedPhone = normalizePhone(phone.trim());
    if (user.phone && normalizePhone(user.phone) === normalizedPhone) return;

    const verifiedPhone = await getUserVerifiedPhone(userId);
    if (verifiedPhone !== normalizedPhone) {
      throw new ApiError(400, 'Phone verification required', ErrorCodes.PHONE_VERIFICATION_REQUIRED);
    }
  }

  private generatePhoneCode() {
    return env.PHONE_SKIP_VERIFY ? '000000' : Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async issuePhoneVerificationCode(email: string, phone: string, locale: 'ar' | 'en', userId: string) {
    const code = this.generatePhoneCode();
    await authRepository.createAuthCode({
      email,
      phone,
      codeHash: await hashPassword(code),
      purpose: AuthCodePurpose.PHONE_VERIFICATION,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    await sendAuthCodeWhatsApp(phone, code, locale);
  }

  private async consumePhoneVerificationCode(phone: string, code: string, userId: string) {
    const codes = await authRepository.findActivePhoneAuthCodes(phone, AuthCodePurpose.PHONE_VERIFICATION);
    for (const item of codes) {
      if (item.userId === userId && (await verifyPassword(code, item.codeHash))) {
        await authRepository.consumeAuthCode(item.id);
        return;
      }
    }
    throw new ApiError(400, 'Invalid or expired verification code');
  }

  private generateCode() {
    return env.EMAIL_SKIP_SEND ? env.EMAIL_SKIP_CODE : Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async issueEmailChangeCode(email: string, locale: 'ar' | 'en', userId: string) {
    const code = this.generateCode();
    await authRepository.createAuthCode({
      email,
      codeHash: await hashPassword(code),
      purpose: AuthCodePurpose.EMAIL_VERIFICATION,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    await sendAuthCodeEmail(email, code, 'verify-email', locale);
  }

  private async consumeEmailChangeCode(userId: string, email: string, code: string) {
    const codes = await authRepository.findActiveAuthCodes(email, AuthCodePurpose.EMAIL_VERIFICATION);
    for (const item of codes) {
      if (item.userId === userId && (await verifyPassword(code, item.codeHash))) {
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
    await authRepository.createRefreshToken(userId, await hashPassword(tokens.refreshToken), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    return tokens;
  }
}

export const usersService = new UsersService();
