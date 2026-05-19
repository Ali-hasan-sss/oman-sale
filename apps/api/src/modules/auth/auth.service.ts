import { AuthCodePurpose, UserRole } from '@prisma/client';

import { env } from '../../config/env';
import { sendAuthCodeEmail } from '../../shared/email/mailer';
import { ApiError } from '../../shared/utils/api-error';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/tokens';
import { authRepository } from './auth.repository';
import type { AuthTokens, AuthUserResponse } from './auth.types';
import type { ChangePasswordDto, EmailCodeDto, ForgotPasswordDto, LoginDto, RefreshTokenDto, RegisterDto, ResendVerificationDto, ResetPasswordDto } from './auth.validation';

const sanitizeUser = (user: AuthUserResponse): AuthUserResponse => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar
});

export class AuthService {
  async register(dto: RegisterDto): Promise<{ email: string; pendingVerification: true }> {
    const existing = await authRepository.findByEmail(dto.email);
    if (existing) throw new ApiError(409, 'Email is already registered');

    const password = await hashPassword(dto.password);
    const user = await authRepository.createUser({ ...dto, password });
    await this.issueCode(user.email, AuthCodePurpose.EMAIL_VERIFICATION, dto.locale, user.id);

    return { email: user.email, pendingVerification: true };
  }

  async login(dto: LoginDto): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const user = await authRepository.findByEmail(dto.email);
    if (!user || user.deletedAt) throw new ApiError(401, 'Invalid credentials');
    if (!user.isActive || user.isBlocked) throw new ApiError(403, 'Account is not allowed');
    if (!user.isVerified) throw new ApiError(403, 'Email verification required');

    const validPassword = await verifyPassword(dto.password, user.password);
    if (!validPassword) throw new ApiError(401, 'Invalid credentials');

    return {
      user: sanitizeUser(user),
      tokens: await this.createTokens(user.id, user.email, user.role)
    };
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
    await this.consumeCode(dto.email, dto.code, AuthCodePurpose.EMAIL_VERIFICATION);
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
    await this.issueCode(user.email, AuthCodePurpose.EMAIL_VERIFICATION, dto.locale, user.id);
    return { sent: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await authRepository.findByEmail(dto.email);
    if (user && !user.deletedAt) {
      await this.issueCode(user.email, AuthCodePurpose.PASSWORD_RESET, dto.locale, user.id);
    }
    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await authRepository.findByEmail(dto.email);
    if (!user || user.deletedAt) throw new ApiError(404, 'User not found');
    await this.consumeCode(dto.email, dto.code, AuthCodePurpose.PASSWORD_RESET);
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

  private generateCode() {
    return env.EMAIL_SKIP_SEND ? env.EMAIL_SKIP_CODE : Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async issueCode(email: string, purpose: AuthCodePurpose, locale: 'ar' | 'en', userId?: string) {
    const code = this.generateCode();
    const codeHash = await hashPassword(code);
    await authRepository.createAuthCode({
      email,
      codeHash,
      purpose,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    await sendAuthCodeEmail(email, code, purpose === AuthCodePurpose.EMAIL_VERIFICATION ? 'verify-email' : 'reset-password', locale);
  }

  private async consumeCode(email: string, code: string, purpose: AuthCodePurpose) {
    const codes = await authRepository.findActiveAuthCodes(email, purpose);
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
