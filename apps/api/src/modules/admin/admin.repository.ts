import { PaymentStatus, Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import { buildTrendSeries, getTrendSinceDate, toNumber } from './admin-statistics.utils';
import type { ListAdminUsersQuery, ListAdminReportsQuery, UpdateAdminUserDto } from './admin.validation';

const notDeleted = { deletedAt: null };

export class AdminRepository {
  async statistics() {
    const since = getTrendSinceDate();
    const thirtyDaysAgo = since;
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [
      users,
      newUsersLast30Days,
      ads,
      activeAds,
      pendingAds,
      stores,
      activeStores,
      inactiveStores,
      reports,
      paymentsTotal,
      paymentsPaid,
      paymentsPending,
      paymentsFailed,
      revenueTotal,
      revenueLast30Days,
      revenueStoreSubscriptions,
      revenuePromotions,
      revenueBanners,
      subscriptionStatusGroups,
      bannerStatusGroups,
      adStatusGroups,
      subscriptionsExpiringSoon,
      bannerRequestsPendingApproval,
      userTrendRows,
      adTrendRows,
      reportTrendRows,
      revenueTrendRows,
      subscriptionTrendRows,
      bannerTrendRows
    ] = await Promise.all([
      prisma.user.count({ where: notDeleted }),
      prisma.user.count({ where: { ...notDeleted, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.ad.count({ where: notDeleted }),
      prisma.ad.count({ where: { ...notDeleted, isActive: true, status: 'ACTIVE' } }),
      prisma.ad.count({
        where: {
          ...notDeleted,
          OR: [{ status: 'PENDING' }, { isApproved: false }]
        }
      }),
      prisma.store.count({ where: notDeleted }),
      prisma.store.count({ where: { ...notDeleted, isActive: true } }),
      prisma.store.count({ where: { ...notDeleted, isActive: false } }),
      prisma.report.count({ where: notDeleted }),
      prisma.payment.count({ where: notDeleted }),
      prisma.payment.count({ where: { ...notDeleted, status: PaymentStatus.PAID } }),
      prisma.payment.count({ where: { ...notDeleted, status: PaymentStatus.PENDING } }),
      prisma.payment.count({ where: { ...notDeleted, status: PaymentStatus.FAILED } }),
      prisma.payment.aggregate({
        where: { ...notDeleted, status: PaymentStatus.PAID },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          ...notDeleted,
          status: PaymentStatus.PAID,
          paidAt: { gte: thirtyDaysAgo }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          ...notDeleted,
          status: PaymentStatus.PAID,
          storeSubscriptionId: { not: null }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          ...notDeleted,
          status: PaymentStatus.PAID,
          promotionId: { not: null }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          ...notDeleted,
          status: PaymentStatus.PAID,
          bannerRequestId: { not: null }
        },
        _sum: { amount: true }
      }),
      prisma.storeSubscription.groupBy({
        by: ['status'],
        where: notDeleted,
        _count: { _all: true }
      }),
      prisma.bannerRequest.groupBy({
        by: ['status'],
        _count: { _all: true }
      }),
      prisma.ad.groupBy({
        by: ['status'],
        where: notDeleted,
        _count: { _all: true }
      }),
      prisma.storeSubscription.count({
        where: {
          ...notDeleted,
          status: 'ACTIVE',
          endsAt: { gte: new Date(), lte: sevenDaysFromNow }
        }
      }),
      prisma.bannerRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE_TRUNC('day', "createdAt")::date AS day, COUNT(*)::bigint AS count
        FROM "User"
        WHERE "deletedAt" IS NULL AND "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day
      `,
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE_TRUNC('day', "createdAt")::date AS day, COUNT(*)::bigint AS count
        FROM "Ad"
        WHERE "deletedAt" IS NULL AND "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day
      `,
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE_TRUNC('day', "createdAt")::date AS day, COUNT(*)::bigint AS count
        FROM "Report"
        WHERE "deletedAt" IS NULL AND "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day
      `,
      prisma.$queryRaw<Array<{ day: Date; amount: Prisma.Decimal | null }>>`
        SELECT DATE_TRUNC('day', "paidAt")::date AS day, COALESCE(SUM(amount), 0) AS amount
        FROM "Payment"
        WHERE "deletedAt" IS NULL
          AND status = 'PAID'
          AND "paidAt" IS NOT NULL
          AND "paidAt" >= ${since}
        GROUP BY day
        ORDER BY day
      `,
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE_TRUNC('day', "createdAt")::date AS day, COUNT(*)::bigint AS count
        FROM "StoreSubscription"
        WHERE "deletedAt" IS NULL AND "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day
      `,
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE_TRUNC('day', "createdAt")::date AS day, COUNT(*)::bigint AS count
        FROM "BannerRequest"
        WHERE "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day
      `
    ]);

    const trialSubscriptions = await prisma.storeSubscription.count({
      where: { ...notDeleted, isTrial: true, status: 'ACTIVE' }
    });

    const mapGroup = <T extends string>(groups: Array<{ status: T; _count: { _all: number } }>) =>
      groups.map((item) => ({ status: item.status, count: item._count._all }));

    const userTrend = buildTrendSeries(
      userTrendRows.map((row) => ({ day: row.day, value: toNumber(row.count) }))
    );
    const adTrend = buildTrendSeries(
      adTrendRows.map((row) => ({ day: row.day, value: toNumber(row.count) }))
    );
    const reportTrend = buildTrendSeries(
      reportTrendRows.map((row) => ({ day: row.day, value: toNumber(row.count) }))
    );
    const revenueTrend = buildTrendSeries(
      revenueTrendRows.map((row) => ({ day: row.day, value: toNumber(row.amount) }))
    );
    const subscriptionTrend = buildTrendSeries(
      subscriptionTrendRows.map((row) => ({ day: row.day, value: toNumber(row.count) }))
    );
    const bannerTrend = buildTrendSeries(
      bannerTrendRows.map((row) => ({ day: row.day, value: toNumber(row.count) }))
    );

    return {
      summary: {
        users,
        newUsersLast30Days,
        ads,
        activeAds,
        pendingAds,
        stores,
        activeStores,
        reports,
        payments: paymentsTotal,
        paymentsPaid,
        paymentsPending,
        paymentsFailed,
        revenueTotal: toNumber(revenueTotal._sum.amount),
        revenueLast30Days: toNumber(revenueLast30Days._sum.amount),
        revenueStoreSubscriptions: toNumber(revenueStoreSubscriptions._sum.amount),
        revenuePromotions: toNumber(revenuePromotions._sum.amount),
        revenueBanners: toNumber(revenueBanners._sum.amount),
        storeSubscriptionsActive: subscriptionStatusGroups.find((item) => item.status === 'ACTIVE')?._count._all ?? 0,
        storeSubscriptionsPending: subscriptionStatusGroups.find((item) => item.status === 'PENDING')?._count._all ?? 0,
        storeSubscriptionsExpired: subscriptionStatusGroups.find((item) => item.status === 'EXPIRED')?._count._all ?? 0,
        storeSubscriptionsTrial: trialSubscriptions,
        bannerRequestsTotal: bannerStatusGroups.reduce((sum, item) => sum + item._count._all, 0),
        bannerRequestsPendingApproval,
        bannerRequestsActive: bannerStatusGroups.find((item) => item.status === 'ACTIVE')?._count._all ?? 0
      },
      trends: {
        labels: userTrend.labels,
        users: userTrend.values,
        ads: adTrend.values,
        reports: reportTrend.values,
        revenue: revenueTrend.values,
        storeSubscriptions: subscriptionTrend.values,
        bannerRequests: bannerTrend.values
      },
      breakdown: {
        adsByStatus: mapGroup(adStatusGroups),
        subscriptionsByStatus: mapGroup(subscriptionStatusGroups),
        bannerRequestsByStatus: mapGroup(bannerStatusGroups),
        revenueBySource: [
          { source: 'storeSubscriptions', amount: toNumber(revenueStoreSubscriptions._sum.amount) },
          { source: 'promotions', amount: toNumber(revenuePromotions._sum.amount) },
          { source: 'banners', amount: toNumber(revenueBanners._sum.amount) }
        ].filter((item) => item.amount > 0)
      },
      pending: {
        reports,
        pendingAds,
        bannerRequestsPendingApproval,
        inactiveStores,
        subscriptionsExpiringSoon
      }
    };
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
