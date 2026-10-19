import type { BannerPlacement, BannerRequestStatus, PaymentProvider, Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';

export class BannerRequestsRepository {
  getPricingByPlacement(placement: BannerPlacement) {
    return prisma.bannerPricing.findUnique({ where: { placement } });
  }

  upsertPricing(
    placement: BannerPlacement,
    data: {
      pricePerDay: number;
      minDays: number;
      maxDays: number;
      isActive: boolean;
      titleAr?: string | null;
      titleEn?: string | null;
      subtitleAr?: string | null;
      subtitleEn?: string | null;
    }
  ) {
    return prisma.bannerPricing.upsert({
      where: { placement },
      update: data,
      create: { placement, ...data }
    });
  }

  createRequest(data: {
    placement: BannerPlacement;
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

  listForAdmin(status?: BannerRequestStatus, placement?: BannerPlacement) {
    return prisma.bannerRequest.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(placement ? { placement } : {})
      },
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

  approveRequest(input: {
    requestId: string;
    placement: BannerPlacement;
    imageUrl: string;
    linkUrl: string;
    textAr?: string | null;
    textEn?: string | null;
    startsAt: Date;
    endsAt: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const sortOrder = await tx.heroBanner
        .aggregate({ where: { placement: input.placement }, _max: { sortOrder: true } })
        .then((result) => (result._max.sortOrder ?? -1) + 1);

      const banner = await tx.heroBanner.create({
        data: {
          placement: input.placement,
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
