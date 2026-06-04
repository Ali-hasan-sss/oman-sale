import type { BannerRequestStatus, PaymentProvider, Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';

export class BannerRequestsRepository {
  getActivePricing() {
    return prisma.bannerPricing.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  updatePricing(id: string, data: Prisma.BannerPricingUpdateInput) {
    return prisma.bannerPricing.update({ where: { id }, data });
  }

  createRequest(data: {
    userId: string;
    imageUrl: string;
    linkUrl: string;
    textAr?: string | null;
    textEn?: string | null;
    durationDays: number;
    totalPrice: number;
    status: BannerRequestStatus;
  }) {
    return prisma.bannerRequest.create({ data });
  }

  findById(id: string) {
    return prisma.bannerRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        payment: true,
        heroBanner: true
      }
    });
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.bannerRequest.findFirst({
      where: { id, userId },
      include: { payment: true, heroBanner: true }
    });
  }

  listForUser(userId: string) {
    return prisma.bannerRequest.findMany({
      where: { userId },
      include: { payment: true, heroBanner: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  listForAdmin(status?: BannerRequestStatus) {
    return prisma.bannerRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        payment: true,
        heroBanner: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  updateStatus(id: string, data: Prisma.BannerRequestUpdateInput) {
    return prisma.bannerRequest.update({ where: { id }, data });
  }

  createPaymentForRequest(input: {
    userId: string;
    requestId: string;
    amount: number;
    provider: PaymentProvider;
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
        bannerRequestId: input.requestId
      }
    });
  }

  findPaymentBySessionId(sessionId: string) {
    return prisma.payment.findFirst({
      where: { transactionId: sessionId, deletedAt: null },
      include: { bannerRequest: true }
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

  getNextBannerSortOrder() {
    return prisma.heroBanner
      .aggregate({ _max: { sortOrder: true } })
      .then((result) => (result._max.sortOrder ?? -1) + 1);
  }

  approveRequest(input: {
    requestId: string;
    imageUrl: string;
    linkUrl: string;
    textAr?: string | null;
    textEn?: string | null;
    startsAt: Date;
    endsAt: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const sortOrder = await tx.heroBanner
        .aggregate({ _max: { sortOrder: true } })
        .then((result) => (result._max.sortOrder ?? -1) + 1);

      const banner = await tx.heroBanner.create({
        data: {
          sortOrder,
          imageUrl: input.imageUrl,
          linkUrl: input.linkUrl,
          textAr: input.textAr?.trim() || null,
          textEn: input.textEn?.trim() || null,
          isActive: true,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          bannerRequestId: input.requestId
        }
      });

      const request = await tx.bannerRequest.update({
        where: { id: input.requestId },
        data: {
          status: 'ACTIVE',
          approvedAt: new Date(),
          startsAt: input.startsAt,
          endsAt: input.endsAt
        },
        include: { user: { select: { id: true, fullName: true, email: true } }, payment: true, heroBanner: true }
      });

      return { banner, request };
    });
  }

  expireActiveRequests(now: Date) {
    return prisma.$transaction(async (tx) => {
      const expiredBanners = await tx.heroBanner.findMany({
        where: {
          isActive: true,
          endsAt: { lt: now },
          bannerRequestId: { not: null }
        },
        select: { id: true, bannerRequestId: true }
      });

      if (expiredBanners.length === 0) return 0;

      await tx.heroBanner.updateMany({
        where: { id: { in: expiredBanners.map((banner) => banner.id) } },
        data: { isActive: false }
      });

      const requestIds = expiredBanners
        .map((banner) => banner.bannerRequestId)
        .filter((id): id is string => Boolean(id));

      await tx.bannerRequest.updateMany({
        where: { id: { in: requestIds }, status: 'ACTIVE' },
        data: { status: 'EXPIRED' }
      });

      return expiredBanners.length;
    });
  }
}

export const bannerRequestsRepository = new BannerRequestsRepository();
