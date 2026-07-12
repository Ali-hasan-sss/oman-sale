import { prisma } from '../../shared/prisma/client';
import { createSlug } from '../../shared/utils/slug';
import type { CreatePromotionPlanDto, PromoteAdDto, UpdatePromotionPlanDto } from './promotions.validation';

export class PromotionsRepository {
  listPlans(includeInactive = false) {
    return prisma.promotionPlan.findMany({
      where: {
        deletedAt: null,
        ...(!includeInactive && { isActive: true })
      },
      orderBy: [{ priorityScore: 'asc' }, { createdAt: 'desc' }]
    });
  }

  async createPlan(dto: CreatePromotionPlanDto) {
    const name = await this.generateUniqueName(dto.nameEn || dto.nameAr);

    return prisma.promotionPlan.create({
      data: {
        ...dto,
        name,
        description: dto.descriptionAr,
        pricePerDay: dto.monthPrice / 30,
        badgeLabel: dto.badgeLabel || dto.nameAr
      }
    });
  }

  /** Build a unique slug for `name`, avoiding collisions with any existing plan (including soft-deleted ones). */
  private async generateUniqueName(source: string, excludeId?: string) {
    const base = createSlug(source) || 'plan';
    let candidate = base;
    let suffix = 1;

    // The `name` column is globally unique, so soft-deleted plans still reserve their slug.
    while (true) {
      const existing = await prisma.promotionPlan.findFirst({
        where: { name: candidate, ...(excludeId && { id: { not: excludeId } }) },
        select: { id: true }
      });
      if (!existing) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  findPlanById(id: string) {
    return prisma.promotionPlan.findFirst({ where: { id, deletedAt: null } });
  }

  findAdForPromotion(id: string) {
    return prisma.ad.findFirst({ where: { id, deletedAt: null }, select: { id: true, userId: true } });
  }

  async updatePlan(id: string, dto: UpdatePromotionPlanDto) {
    const data = {
      ...dto,
      ...(dto.nameEn || dto.nameAr
        ? { name: await this.generateUniqueName(dto.nameEn || dto.nameAr || '', id) }
        : {}),
      ...(dto.descriptionAr && { description: dto.descriptionAr }),
      ...(dto.monthPrice !== undefined && { pricePerDay: dto.monthPrice / 30 }),
      ...(dto.badgeLabel !== undefined ? { badgeLabel: dto.badgeLabel || dto.nameAr } : {})
    };

    return prisma.promotionPlan.update({ where: { id }, data });
  }

  softDeletePlan(id: string) {
    return prisma.promotionPlan.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  clearIncludedPromotion(adId: string) {
    return prisma.adPromotion.updateMany({
      where: { adId, totalPrice: 0, deletedAt: null },
      data: { isActive: false }
    });
  }

  clearStoreIncludedPromotions(storeId: string) {
    return prisma.adPromotion.updateMany({
      where: {
        totalPrice: 0,
        deletedAt: null,
        ad: { storeId, deletedAt: null }
      },
      data: { isActive: false }
    });
  }

  applyIncludedPromotion(input: { adId: string; planId: string; endsAt: Date }) {
    const startsAt = new Date();

    return prisma.$transaction(async (tx) => {
      const promotion = await tx.adPromotion.upsert({
        where: { adId: input.adId },
        update: {
          planId: input.planId,
          startsAt,
          endsAt: input.endsAt,
          totalPrice: 0,
          isActive: true,
          deletedAt: null
        },
        create: {
          adId: input.adId,
          planId: input.planId,
          startsAt,
          endsAt: input.endsAt,
          totalPrice: 0
        },
        include: { plan: true }
      });

      await tx.ad.update({
        where: { id: input.adId },
        data: { isActive: true, isSold: false }
      });

      return promotion;
    });
  }

  createPendingPromotion(dto: PromoteAdDto, totalPrice: number) {
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + dto.days * 24 * 60 * 60 * 1000);

    return prisma.$transaction(async (tx) => {
      const promotion = await tx.adPromotion.upsert({
        where: { adId: dto.adId },
        update: {
          planId: dto.planId,
          startsAt,
          endsAt,
          totalPrice,
          isActive: false,
          deletedAt: null
        },
        create: {
          adId: dto.adId,
          planId: dto.planId,
          startsAt,
          endsAt,
          totalPrice,
          isActive: false
        },
        include: { plan: true, ad: { select: { id: true, title: true } } }
      });

      return promotion;
    });
  }

  activatePromotion(promotionId: string) {
    return prisma.$transaction(async (tx) => {
      const promotion = await tx.adPromotion.update({
        where: { id: promotionId },
        data: { isActive: true },
        include: { plan: true }
      });

      await tx.ad.update({
        where: { id: promotion.adId },
        data: { isActive: true, isSold: false }
      });

      return promotion;
    });
  }

  createPaymentForPromotion(input: {
    userId: string;
    promotionId: string;
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
        promotionId: input.promotionId
      }
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

  async promoteAd(dto: PromoteAdDto) {
    const plan = await prisma.promotionPlan.findUniqueOrThrow({ where: { id: dto.planId } });
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + dto.days * 24 * 60 * 60 * 1000);
    const totalPrice =
      dto.days === 7
        ? Number(plan.weekPrice)
        : dto.days === 14
          ? Number(plan.twoWeeksPrice)
          : dto.days === 30
            ? Number(plan.monthPrice)
            : Number(plan.pricePerDay) * dto.days;

    return prisma.$transaction(async (tx) => {
      const promotion = await tx.adPromotion.upsert({
        where: { adId: dto.adId },
        update: {
          planId: dto.planId,
          startsAt,
          endsAt,
          totalPrice,
          isActive: true,
          deletedAt: null
        },
        create: {
          adId: dto.adId,
          planId: dto.planId,
          startsAt,
          endsAt,
          totalPrice
        },
        include: { plan: true }
      });

      await tx.ad.update({
        where: { id: dto.adId },
        data: {
          isActive: true,
          isSold: false
        }
      });

      return promotion;
    });
  }
}

export const promotionsRepository = new PromotionsRepository();
