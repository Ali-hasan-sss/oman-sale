import { prisma } from '../../shared/prisma/client';
import type { AuthCodePurpose } from '@prisma/client';

export class AuthRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findByPhone(phone: string) {
    return prisma.user.findFirst({ where: { phone, deletedAt: null } });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  findByGoogleId(googleId: string) {
    return prisma.user.findFirst({ where: { googleId, deletedAt: null } });
  }

  createUser(data: { fullName: string; email: string; phone: string; password: string }) {
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password
      }
    });
  }

  createGoogleUser(data: {
    fullName: string;
    email: string;
    googleId: string;
    password: string;
    avatar?: string | null;
  }) {
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        googleId: data.googleId,
        password: data.password,
        avatar: data.avatar,
        isVerified: true,
        profileCompleted: false
      }
    });
  }

  linkGoogleAccount(userId: string, data: { googleId: string; avatar?: string | null }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        googleId: data.googleId,
        ...(data.avatar ? { avatar: data.avatar } : {}),
        isVerified: true
      }
    });
  }

  completeUserProfile(userId: string, data: { fullName: string; phone: string; password: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        password: data.password,
        profileCompleted: true
      }
    });
  }

  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt }
    });
  }

  findActiveRefreshTokens(userId: string) {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    });
  }

  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  revokeAllRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  incrementTokenVersion(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true }
    });
  }

  /** Revoke every refresh token and bump tokenVersion so old access tokens fail immediately. */
  async replaceUserSession(userId: string) {
    await this.revokeAllRefreshTokens(userId);
    return this.incrementTokenVersion(userId);
  }

  createAuthCode(data: {
    email: string;
    phone?: string;
    codeHash: string;
    purpose: AuthCodePurpose;
    expiresAt: Date;
    userId?: string;
  }) {
    return prisma.authVerificationCode.create({ data });
  }

  findActiveAuthCodes(email: string, purpose: AuthCodePurpose) {
    return prisma.authVerificationCode.findMany({
      where: { email, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });
  }

  findActivePhoneAuthCodes(phone: string, purpose: AuthCodePurpose) {
    return prisma.authVerificationCode.findMany({
      where: { phone, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });
  }

  consumeAuthCode(id: string) {
    return prisma.authVerificationCode.update({ where: { id }, data: { consumedAt: new Date() } });
  }

  verifyUserEmail(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
  }

  updatePassword(userId: string, password: string) {
    return prisma.user.update({ where: { id: userId }, data: { password } });
  }
}

export const authRepository = new AuthRepository();
