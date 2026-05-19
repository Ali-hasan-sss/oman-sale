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

  createPlan(dto: CreatePromotionPlanDto) {
    const name = createSlug(dto.nameEn || dto.nameAr);

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

  findPlanById(id: string) {
    return prisma.promotionPlan.findFirst({ where: { id, deletedAt: null } });
  }

  findAdForPromotion(id: string) {
    return prisma.ad.findFirst({ where: { id, deletedAt: null }, select: { id: true, userId: true } });
  }

  updatePlan(id: string, dto: UpdatePromotionPlanDto) {
    const data = {
      ...dto,
      ...(dto.nameEn || dto.nameAr ? { name: createSlug(dto.nameEn || dto.nameAr || '') } : {}),
      ...(dto.descriptionAr && { description: dto.descriptionAr }),
      ...(dto.monthPrice !== undefined && { pricePerDay: dto.monthPrice / 30 }),
      ...(dto.badgeLabel !== undefined ? { badgeLabel: dto.badgeLabel || dto.nameAr } : {})
    };

    return prisma.promotionPlan.update({ where: { id }, data });
  }

  softDeletePlan(id: string) {
    return prisma.promotionPlan.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
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
