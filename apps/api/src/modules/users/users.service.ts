import { AuthCodePurpose, Prisma } from '@prisma/client';

import { env } from '../../config/env';
import { sendAuthCodeEmail } from '../../shared/email/mailer';
import { ApiError } from '../../shared/utils/api-error';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { signAccessToken, signRefreshToken } from '../../shared/utils/tokens';
import { authRepository } from '../auth/auth.repository';
import type { AuthTokens } from '../auth/auth.types';
import { usersRepository } from './users.repository';
import type { ChangePasswordDto, RequestEmailChangeDto, UpdateProfileDto, VerifyEmailChangeDto } from './users.validation';

export class UsersService {
  async me(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  list() {
    return usersRepository.list();
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    try {
      return await usersRepository.updateProfile(userId, dto);
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
