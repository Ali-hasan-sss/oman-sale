import { Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import type { ListAdminUsersQuery, UpdateAdminUserDto } from './admin.validation';

export class AdminRepository {
  async statistics() {
    const [users, ads, pendingAds, payments] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.ad.count({ where: { deletedAt: null } }),
      prisma.ad.count({ where: { isActive: false, deletedAt: null } }),
      prisma.payment.count({ where: { deletedAt: null } })
    ]);

    return { users, ads, pendingAds, payments };
  }

  async listUsers(query: ListAdminUsersQuery) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role && { role: query.role }),
      ...(query.q && {
        OR: [
          { fullName: { contains: query.q, mode: 'insensitive' } },
          { email: { contains: query.q, mode: 'insensitive' } },
          { phone: { contains: query.q, mode: 'insensitive' } }
        ]
      })
    };

    const skip = (query.page - 1) * query.limit;
    const select = {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      isVerified: true,
      isActive: true,
      isBlocked: true,
      lastSeenAt: true,
      createdAt: true,
      _count: {
        select: {
          ads: true,
          payments: true,
          reports: true
        }
      }
    } satisfies Prisma.UserSelect;

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return { items, total, page: query.page, limit: query.limit };
  }

  findUserById(id: string) {
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
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ads: true,
            favorites: true,
            payments: true,
            reports: true
          }
        }
      }
    });
  }

  updateUser(id: string, data: UpdateAdminUserDto) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        isBlocked: true,
        updatedAt: true
      }
    });
  }
}

export const adminRepository = new AdminRepository();
