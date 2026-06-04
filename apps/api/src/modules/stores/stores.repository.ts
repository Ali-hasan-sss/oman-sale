import { Prisma, StoreSubscriptionStatus } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import { createSlug } from '../../shared/utils/slug';
import type { CreateStoreDto, ListStoresQuery, SubscribeStoreDto, UpdateStoreDto } from './stores.validation';

const storeTypeSelect = { id: true, nameAr: true, nameEn: true, slug: true, icon: true } as const;

export class StoresRepository {
  listPublic(query: ListStoresQuery) {
    const now = new Date();
    const where: Prisma.StoreWhereInput = {
      deletedAt: null,
      isActive: true,
      subscriptions: {
        some: {
          deletedAt: null,
          isActive: true,
          status: StoreSubscriptionStatus.ACTIVE,
          endsAt: { gt: now }
        }
      },
      ...(query.rootCategoryId && { rootCategoryId: query.rootCategoryId }),
      ...(query.storeTypeId && { storeTypeId: query.storeTypeId }),
      ...(query.city && { city: query.city }),
      ...(query.q && {
        OR: [
          { nameAr: { contains: query.q, mode: 'insensitive' } },
          { nameEn: { contains: query.q, mode: 'insensitive' } },
          { slug: { contains: query.q, mode: 'insensitive' } }
        ]
      })
    };

    const skip = (query.page - 1) * query.limit;

    return Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: query.limit,
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          bioAr: true,
          bioEn: true,
          logoUrl: true,
          coverUrl: true,
          phone: true,
          city: true,
          rootCategory: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          storeType: { select: storeTypeSelect },
          _count: { select: { ads: { where: { deletedAt: null, isActive: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.store.count({ where })
    ]).then(([items, total]) => ({ items, total, page: query.page, limit: query.limit }));
  }

  findBySlug(slug: string) {
    return prisma.store.findFirst({
      where: { slug: createSlug(slug), deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, avatar: true, isBlocked: true } },
        rootCategory: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
        storeType: { select: storeTypeSelect },
        subscriptions: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: { plan: true, pricing: true }
        },
        _count: { select: { ads: { where: { deletedAt: null, isActive: true } } } }
      }
    });
  }

  findById(id: string) {
    return prisma.store.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, avatar: true } },
        rootCategory: { select: { id: true, nameAr: true, nameEn: true, slug: true, parentId: true } },
        storeType: { select: storeTypeSelect },
        subscriptions: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: { plan: true, pricing: true }
        }
      }
    });
  }

  listForUser(userId: string) {
    return prisma.store.findMany({
      where: { userId, deletedAt: null },
      include: {
        rootCategory: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
        storeType: { select: storeTypeSelect },
        subscriptions: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: { plan: true, pricing: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  countForUser(userId: string) {
    return prisma.store.count({ where: { userId, deletedAt: null } });
  }

  findSlug(slug: string) {
    return prisma.store.findFirst({ where: { slug: createSlug(slug), deletedAt: null }, select: { id: true } });
  }

  slugTaken(slug: string, excludeId?: string) {
    return prisma.store.findFirst({
      where: {
        slug: createSlug(slug),
        ...(excludeId && { id: { not: excludeId } })
      },
      select: { id: true }
    });
  }

  async resolveUniqueStoreSlug(input: { slug?: string; nameEn: string; nameAr: string }) {
    const base = createSlug(input.slug || input.nameEn || input.nameAr);
    if (!base) return `store-${Date.now()}`;

    let candidate = base;
    let suffix = 2;

    while (await this.slugTaken(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  async create(userId: string, dto: CreateStoreDto, subscription: {
    planId: string;
    pricingId: string;
    billingPeriod: CreateStoreDto['billingPeriod'];
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    maxListings: number;
  }) {
    const slug = await this.resolveUniqueStoreSlug({
      slug: dto.slug,
      nameEn: dto.nameEn,
      nameAr: dto.nameAr
    });

    return prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          userId,
          slug,
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          bioAr: dto.bioAr ?? '',
          bioEn: dto.bioEn ?? '',
          logoUrl: dto.logoUrl,
          coverUrl: dto.coverUrl,
          phone: dto.phone,
          city: dto.city,
          nationalId: dto.nationalId,
          commercialRegistrationNumber: dto.commercialRegistrationNumber,
          workingHours: dto.workingHours as Prisma.InputJsonValue | undefined,
          rootCategoryId: dto.rootCategoryId,
          storeTypeId: dto.storeTypeId,
          isActive: false
        }
      });

      const storeSubscription = await tx.storeSubscription.create({
        data: {
          storeId: store.id,
          planId: subscription.planId,
          pricingId: subscription.pricingId,
          billingPeriod: subscription.billingPeriod,
          basePrice: subscription.basePrice,
          discountAmount: subscription.discountAmount,
          finalPrice: subscription.finalPrice,
          maxListings: subscription.maxListings,
          status: StoreSubscriptionStatus.PENDING
        }
      });

      return { store, subscription: storeSubscription };
    });
  }

  update(id: string, dto: UpdateStoreDto) {
    const { slug, workingHours, ...rest } = dto;
    return prisma.store.update({
      where: { id },
      data: {
        ...rest,
        ...(slug && { slug: createSlug(slug) }),
        ...(workingHours !== undefined && { workingHours: workingHours as Prisma.InputJsonValue })
      }
    });
  }

  softDelete(id: string) {
    return prisma.store.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  rollbackPendingStoreCreation(storeId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.storeSubscription.updateMany({
        where: { storeId, deletedAt: null, status: StoreSubscriptionStatus.PENDING },
        data: { deletedAt: new Date(), isActive: false, status: StoreSubscriptionStatus.CANCELLED }
      });
      await tx.store.update({
        where: { id: storeId },
        data: { deletedAt: new Date(), isActive: false }
      });
    });
  }

  createSubscription(storeId: string, data: {
    planId: string;
    pricingId: string;
    billingPeriod: SubscribeStoreDto['billingPeriod'];
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    maxListings: number;
  }) {
    return prisma.storeSubscription.create({
      data: {
        storeId,
        planId: data.planId,
        pricingId: data.pricingId,
        billingPeriod: data.billingPeriod,
        basePrice: data.basePrice,
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice,
        maxListings: data.maxListings,
        status: StoreSubscriptionStatus.PENDING
      },
      include: { plan: true, pricing: true }
    });
  }

  deactivateActiveSubscriptions(storeId: string) {
    return prisma.storeSubscription.updateMany({
      where: { storeId, deletedAt: null, isActive: true },
      data: { isActive: false, status: StoreSubscriptionStatus.CANCELLED }
    });
  }

  createPaymentForSubscription(input: {
    userId: string;
    subscriptionId: string;
    amount: number;
    provider: import('@prisma/client').PaymentProvider;
    sessionId: string;
    paymentUrl: string;
  }) {
    return prisma.payment.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        provider: input.provider,
        status: 'PENDING',
        transactionId: input.sessionId,
        paymentUrl: input.paymentUrl,
        storeSubscriptionId: input.subscriptionId
      }
    });
  }

  findPaymentBySessionId(sessionId: string) {
    return prisma.payment.findFirst({
      where: { transactionId: sessionId, deletedAt: null }
    });
  }

  markPaymentPaid(paymentId: string, transactionId: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        transactionId
      }
    });
  }

  hasUserUsedPlanTrial(userId: string, planId: string) {
    return prisma.storeSubscription
      .count({
        where: {
          planId,
          isTrial: true,
          deletedAt: null,
          store: { userId, deletedAt: null }
        }
      })
      .then((count) => count > 0);
  }

  countActiveListings(storeId: string) {
    return prisma.ad.count({
      where: { storeId, deletedAt: null, status: 'ACTIVE' }
    });
  }

  listForAdmin(query: import('./stores.validation').ListAdminStoresQuery) {
    const where: Prisma.StoreWhereInput = {
      deletedAt: null,
      ...(query.rootCategoryId && { rootCategoryId: query.rootCategoryId }),
      ...(query.storeTypeId && { storeTypeId: query.storeTypeId }),
      ...(query.city && { city: query.city }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.q && {
        OR: [
          { nameAr: { contains: query.q, mode: 'insensitive' } },
          { nameEn: { contains: query.q, mode: 'insensitive' } },
          { slug: { contains: query.q, mode: 'insensitive' } },
          { user: { email: { contains: query.q, mode: 'insensitive' } } },
          { user: { fullName: { contains: query.q, mode: 'insensitive' } } }
        ]
      })
    };

    const skip = (query.page - 1) * query.limit;

    return Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: query.limit,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true, avatar: true } },
          rootCategory: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          storeType: { select: storeTypeSelect },
          subscriptions: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { plan: true, pricing: true }
          },
          _count: { select: { ads: { where: { deletedAt: null } } } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.store.count({ where })
    ]).then(([items, total]) => ({ items, total, page: query.page, limit: query.limit }));
  }

  setActive(id: string, isActive: boolean) {
    return prisma.store.update({ where: { id }, data: { isActive } });
  }

  setStoreAdsActive(storeId: string, isActive: boolean) {
    return prisma.ad.updateMany({
      where: { storeId, deletedAt: null },
      data: { isActive }
    });
  }

  listAds(storeId: string, query: import('../ads/ads.validation').ListAdsQuery) {
    const where: Prisma.AdWhereInput = {
      storeId,
      deletedAt: null,
      ...(query.q && {
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } }
        ]
      })
    };
    const skip = (query.page - 1) * query.limit;

    return Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: query.limit,
        include: {
          images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
          promotion: { include: { plan: true } },
          category: true,
          store: { select: { id: true, nameAr: true, nameEn: true, slug: true, logoUrl: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ad.count({ where })
    ]).then(([items, total]) => ({ items, total, page: query.page, limit: query.limit }));
  }

  listPublicAds(storeId: string, query: import('../ads/ads.validation').ListAdsQuery) {
    const where: Prisma.AdWhereInput = {
      storeId,
      deletedAt: null,
      isActive: true,
      ...(query.q && {
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } }
        ]
      })
    };
    const skip = (query.page - 1) * query.limit;

    return Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: query.limit,
        include: {
          images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
          promotion: { include: { plan: true } },
          category: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ad.count({ where })
    ]).then(([items, total]) => ({ items, total, page: query.page, limit: query.limit }));
  }
}

export const storesRepository = new StoresRepository();
