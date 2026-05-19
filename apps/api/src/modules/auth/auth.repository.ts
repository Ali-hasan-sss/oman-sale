import { prisma } from '../../shared/prisma/client';
import type { RegisterDto } from './auth.validation';
import type { AuthCodePurpose } from '@prisma/client';

export class AuthRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  createUser(data: RegisterDto & { password: string }) {
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password
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

  createAuthCode(data: { email: string; codeHash: string; purpose: AuthCodePurpose; expiresAt: Date; userId?: string }) {
    return prisma.authVerificationCode.create({ data });
  }

  findActiveAuthCodes(email: string, purpose: AuthCodePurpose) {
    return prisma.authVerificationCode.findMany({
      where: { email, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
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
