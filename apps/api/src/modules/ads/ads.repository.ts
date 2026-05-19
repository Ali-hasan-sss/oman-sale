import { Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import type { ViewerContext } from '../../shared/utils/viewer-context';
import type { AdminListAdsQuery, CreateAdDto, ListAdsQuery, ReportAdDto, UpdateAdDto } from './ads.validation';

type PublicAdListMode = 'all' | 'latest' | 'featured';

const getTodayStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export class AdsRepository {
  private buildWhere(query: ListAdsQuery, publicOnly: boolean): Prisma.AdWhereInput {
    return {
      deletedAt: null,
      ...(publicOnly && {
        isActive: true,
        isSold: false,
        status: 'ACTIVE',
        isApproved: true
      }),
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.city && { city: query.city }),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        price: {
          ...(query.minPrice !== undefined && { gte: query.minPrice }),
          ...(query.maxPrice !== undefined && { lte: query.maxPrice })
        }
      }),
      ...(query.filterOptionIds.length > 0 && {
        AND: query.filterOptionIds.map((optionId) => ({
          filterValues: { some: { optionId, deletedAt: null } }
        }))
      }),
      ...(query.q && {
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } }
        ]
      })
    };
  }

  async list(query: ListAdsQuery, mode: PublicAdListMode = 'all') {
    const today = getTodayStart();
    const include = {
      images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      promotion: { include: { plan: true, dailyStats: { where: { date: today } } } },
      category: true
    } satisfies Prisma.AdInclude;
    const where = this.buildWhere(query, true);
    const promotedWhere: Prisma.AdWhereInput = {
      ...where,
      promotion: {
        is: {
          deletedAt: null,
          isActive: true,
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
          plan: { is: { deletedAt: null, isActive: true } }
        }
      }
    };
    const takeForMerge = query.page * query.limit;
    const [promotedItems, organicItems, rawTotal] = await Promise.all([
      mode === 'latest'
        ? Promise.resolve([])
        : prisma.ad.findMany({
            where: promotedWhere,
            take: takeForMerge + query.limit,
            include,
            orderBy: [
              { promotion: { plan: { appearsFirst: 'desc' } } },
              { promotion: { plan: { priorityScore: 'desc' } } },
              { promotion: { createdAt: 'desc' } },
              { createdAt: 'desc' }
            ]
          }),
      mode === 'featured'
        ? Promise.resolve([])
        : prisma.ad.findMany({
            where,
            take: takeForMerge + query.limit,
            include,
            orderBy: { createdAt: 'desc' }
          }),
      prisma.ad.count({ where: mode === 'featured' ? promotedWhere : where })
    ]);

    const availablePromotedItems = promotedItems.filter((ad) => {
      const promotion = ad.promotion;
      if (!promotion) return false;
      const todayImpressions = promotion.dailyStats[0]?.impressions ?? 0;
      return todayImpressions < promotion.plan.dailyImpressions;
    });
    const promotedIds = new Set(availablePromotedItems.map((ad) => ad.id));
    const merged = mode === 'latest' ? organicItems : [...availablePromotedItems, ...organicItems.filter((ad) => !promotedIds.has(ad.id))];
    const skip = (query.page - 1) * query.limit;
    const items = merged.slice(skip, skip + query.limit);
    await this.recordPromotionImpressions(items.map((ad) => ad.promotion?.id).filter(Boolean) as string[]);

    const total = mode === 'featured' ? availablePromotedItems.length : rawTotal;
    return { items, total, page: query.page, limit: query.limit };
  }

  async listForAdmin(query: AdminListAdsQuery) {
    const where: Prisma.AdWhereInput = {
      ...this.buildWhere(query, false),
      ...(query.includeDeleted ? { deletedAt: query.deletedOnly ? { not: null } : undefined } : { deletedAt: null }),
      ...(query.userId && { userId: query.userId }),
      ...(query.isApproved !== undefined && { isApproved: query.isApproved })
    };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: query.limit,
        include: {
          images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
          promotion: { include: { plan: true } },
          category: true,
          user: true,
          reports: { where: { deletedAt: null } }
        },
        orderBy: [{ createdAt: 'desc' }]
      }),
      prisma.ad.count({ where })
    ]);

    return { items, total, page: query.page, limit: query.limit };
  }

  async listForUser(userId: string, query: ListAdsQuery) {
    const where: Prisma.AdWhereInput = {
      ...this.buildWhere(query, false),
      userId
    };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: query.limit,
        include: {
          images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
          promotion: { include: { plan: true } },
          category: true
        },
        orderBy: [{ createdAt: 'desc' }]
      }),
      prisma.ad.count({ where })
    ]);

    return { items, total, page: query.page, limit: query.limit };
  }

  private async recordPromotionImpressions(promotionIds: string[]) {
    const uniqueIds = Array.from(new Set(promotionIds));
    if (uniqueIds.length === 0) return;

    const today = getTodayStart();
    await Promise.all(
      uniqueIds.map((promotionId) =>
        prisma.adPromotionDailyImpression.upsert({
          where: { promotionId_date: { promotionId, date: today } },
          update: { impressions: { increment: 1 } },
          create: { promotionId, date: today, impressions: 1 }
        })
      )
    );
  }

  findById(id: string) {
    return prisma.ad.findFirst({
      where: { id, deletedAt: null },
      include: {
        images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        category: true,
        user: true,
        promotion: { include: { plan: true } }
      }
    });
  }

  async listSimilar(adId: string, limit = 3) {
    const ad = await prisma.ad.findFirst({
      where: { id: adId, deletedAt: null },
      select: { categoryId: true, city: true }
    });
    if (!ad) return [];

    const now = new Date();
    return prisma.ad.findMany({
      where: {
        id: { not: adId },
        deletedAt: null,
        categoryId: ad.categoryId,
        isActive: true,
        isSold: false,
        status: 'ACTIVE',
        isApproved: true
      },
      include: {
        images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        category: true,
        promotion: { include: { plan: true } }
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit
    });
  }

  async listFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId, deletedAt: null, ad: { deletedAt: null } },
      include: {
        ad: {
          include: {
            images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
            category: true,
            promotion: { include: { plan: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return favorites.map((favorite) => favorite.ad);
  }

  async listFavoriteIds(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId, deletedAt: null, ad: { deletedAt: null } },
      select: { adId: true }
    });

    return favorites.map((favorite) => favorite.adId);
  }

  async create(userId: string, slug: string, data: CreateAdDto) {
    const filterValues = await this.buildFilterValues(data.filterOptionIds);

    return prisma.ad.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        type: data.type,
        condition: data.condition,
        price: data.price,
        currency: data.currency,
        city: data.city,
        area: data.area,
        latitude: data.latitude,
        longitude: data.longitude,
        contactPhone: data.contactPhone,
        status: 'ACTIVE',
        isApproved: true,
        isActive: true,
        isSold: false,
        approvedAt: new Date(),
        userId,
        categoryId: data.categoryId,
        images: {
          create: data.imageUrls.map((imageUrl, sortOrder) => ({ imageUrl, sortOrder }))
        },
        filterValues: { create: filterValues }
      },
      include: { images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } }
    });
  }

  async update(id: string, data: UpdateAdDto) {
    const { filterOptionIds, imageUrls, ...adData } = data;
    const now = new Date();
    const filterValues = filterOptionIds ? await this.buildFilterValues(filterOptionIds) : undefined;

    return prisma.$transaction(async (tx) => {
      const ad = await tx.ad.update({
        where: { id },
        data: {
          ...adData,
          ...(imageUrls && {
            images: {
              updateMany: {
                where: { deletedAt: null },
                data: { deletedAt: now }
              },
              create: imageUrls.map((imageUrl, sortOrder) => ({ imageUrl, sortOrder }))
            }
          }),
          ...(filterValues && {
            filterValues: {
              updateMany: { where: { deletedAt: null }, data: { deletedAt: now } },
              create: filterValues
            }
          })
        },
        include: { images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } }
      });

      return ad;
    });
  }

  private async buildFilterValues(optionIds: string[]) {
    if (optionIds.length === 0) return [];

    const options = await prisma.categoryFilterOption.findMany({
      where: { id: { in: optionIds }, deletedAt: null, isActive: true, filter: { deletedAt: null, isActive: true } },
      select: { id: true, filterId: true }
    });
    const byFilter = new Map<string, { filterId: string; optionId: string }>();
    for (const option of options) {
      byFilter.set(option.filterId, { filterId: option.filterId, optionId: option.id });
    }

    return Array.from(byFilter.values());
  }

  /**
   * Records one view per unique visitor (device or user). Returns true when the counter increased.
   */
  async recordView(adId: string, ownerUserId: string, context: ViewerContext) {
    if (context.userId && context.userId === ownerUserId) {
      return false;
    }

    try {
      await prisma.$transaction([
        prisma.adView.create({
          data: {
            adId,
            visitorKey: context.visitorKey,
            ipAddress: context.ipAddress,
            source: context.source,
            userAgent: context.userAgent?.slice(0, 500)
          }
        }),
        prisma.ad.update({ where: { id: adId }, data: { views: { increment: 1 } } })
      ]);
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }
      throw error;
    }
  }

  approve(id: string) {
    return prisma.ad.update({
      where: { id },
      data: { status: 'ACTIVE', isApproved: true, approvedAt: new Date(), rejectionReason: null }
    });
  }

  softDelete(id: string) {
    return prisma.ad.update({ where: { id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
  }

  restore(id: string) {
    return prisma.ad.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE', isApproved: true, isActive: true, isSold: false, soldAt: null }
    });
  }

  setActive(id: string, isActive: boolean) {
    return prisma.ad.update({ where: { id }, data: { isActive } });
  }

  markSold(id: string) {
    return prisma.ad.update({ where: { id }, data: { isSold: true, soldAt: new Date() } });
  }

  unmarkSold(id: string) {
    return prisma.ad.update({ where: { id }, data: { isSold: false, soldAt: null } });
  }

  favorite(adId: string, userId: string) {
    return prisma.favorite.upsert({
      where: { userId_adId: { userId, adId } },
      update: { deletedAt: null },
      create: { userId, adId }
    });
  }

  unfavorite(adId: string, userId: string) {
    return prisma.favorite.updateMany({
      where: { userId, adId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  report(adId: string, userId: string, dto: ReportAdDto) {
    return prisma.report.create({
      data: { adId, userId, reason: dto.reason }
    });
  }
}

export const adsRepository = new AdsRepository();
