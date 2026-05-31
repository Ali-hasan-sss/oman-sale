import { Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import type { ListAdminUsersQuery, ListAdminReportsQuery, UpdateAdminUserDto } from './admin.validation';

export class AdminRepository {
  async statistics() {
    const [users, ads, pendingAds, payments, reports] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.ad.count({ where: { deletedAt: null } }),
      prisma.ad.count({ where: { isActive: false, deletedAt: null } }),
      prisma.payment.count({ where: { deletedAt: null } }),
      prisma.report.count({ where: { deletedAt: null } })
    ]);

    return { users, ads, pendingAds, payments, reports };
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

  async listReports(query: ListAdminReportsQuery) {
    const where = { deletedAt: null };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          ad: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              isActive: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                  isActive: true,
                  isBlocked: true
                }
              },
              category: {
                select: {
                  name: true,
                  nameAr: true,
                  nameEn: true
                }
              },
              images: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
                take: 1,
                select: { imageUrl: true }
              }
            }
          }
        }
      }),
      prisma.report.count({ where })
    ]);

    return { items, total, page: query.page, limit: query.limit };
  }

  findReportById(id: string) {
    return prisma.report.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        ad: {
          select: {
            id: true,
            title: true,
            slug: true,
            userId: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                isActive: true,
                isBlocked: true,
                role: true
              }
            }
          }
        }
      }
    });
  }

  softDeleteReport(id: string) {
    return prisma.report.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async banUserCompletely(userId: string) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { isBlocked: true, isActive: false },
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          isBlocked: true,
          updatedAt: true
        }
      });

      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      await tx.ad.updateMany({
        where: { userId, deletedAt: null },
        data: { isActive: false }
      });

      return user;
    });
  }
}

export const adminRepository = new AdminRepository();
