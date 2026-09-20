import { prisma } from '../../shared/prisma/client';
import type { UpdateProfileDto } from './users.validation';

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  avatar: true,
  role: true,
  bio: true,
  isVerified: true,
  isActive: true,
  isBlocked: true,
  profileCompleted: true,
  trustBadgeStatus: true,
  trustIdentityDocType: true,
  trustIdentityDocUrl: true,
  trustBadgeReviewedAt: true,
  trustBadgeRejectionReason: true,
  lastSeenAt: true,
  createdAt: true
} as const;

export class UsersRepository {
  findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: publicUserSelect
    });
  }

  list() {
    return prisma.user.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  findByIdWithPassword(id: string) {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  updateProfile(id: string, data: UpdateProfileDto) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.bio !== undefined && { bio: data.bio || null }),
        ...(data.avatar !== undefined && { avatar: data.avatar || null })
      },
      select: publicUserSelect
    });
  }

  updatePassword(id: string, password: string) {
    return prisma.user.update({
      where: { id },
      data: { password }
    });
  }

  updateEmail(id: string, email: string) {
    return prisma.user.update({
      where: { id },
      data: { email, isVerified: true },
      select: publicUserSelect
    });
  }

  async deleteOwnAccount(id: string, passwordHash: string) {
    const now = new Date();
    const deletedEmail = `deleted+${id}@deleted.omansale.invalid`;

    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now }
      }),
      prisma.pushToken.deleteMany({ where: { userId: id } }),
      prisma.ad.updateMany({
        where: { userId: id, deletedAt: null },
        data: { deletedAt: now, status: 'ARCHIVED', isActive: false }
      }),
      prisma.store.updateMany({
        where: { userId: id, deletedAt: null },
        data: {
          deletedAt: now,
          isActive: false,
          phone: null,
          nationalId: 'DELETED',
          commercialRegistrationNumber: null,
          trustCommercialRegDocUrl: null,
          trustOcciDocUrl: null,
          trustSmeDocUrl: null,
          trustOtherDocUrl: null,
          trustOtherDocLabel: null
        }
      }),
      prisma.user.update({
        where: { id },
        data: {
          deletedAt: now,
          isActive: false,
          isVerified: false,
          fullName: 'Deleted User',
          email: deletedEmail,
          phone: null,
          avatar: null,
          bio: null,
          googleId: null,
          appleId: null,
          password: passwordHash,
          trustIdentityDocType: null,
          trustIdentityDocUrl: null,
          trustBadgeRejectionReason: null,
          tokenVersion: { increment: 1 }
        }
      })
    ]);
  }
}

export const usersRepository = new UsersRepository();
