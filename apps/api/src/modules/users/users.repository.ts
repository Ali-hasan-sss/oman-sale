import { prisma } from '../../shared/prisma/client';
import type { UpdateProfileDto } from './users.validation';

export class UsersRepository {
  findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
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
        lastSeenAt: true,
        createdAt: true
      }
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
      select: {
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
        lastSeenAt: true,
        createdAt: true
      }
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
      select: {
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
        lastSeenAt: true,
        createdAt: true
      }
    });
  }
}

export const usersRepository = new UsersRepository();
