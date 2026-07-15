import { Prisma, RaffleStatus } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import type { CreateRaffleDto, UpdateRaffleDto } from './raffles.validation';

const raffleListSelect = {
  id: true,
  titleAr: true,
  titleEn: true,
  descriptionAr: true,
  descriptionEn: true,
  startsAt: true,
  endsAt: true,
  status: true,
  heroImageUrl: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { entries: true }
  }
} satisfies Prisma.RaffleSelect;

const raffleDetailInclude = {
  planPoints: {
    include: {
      plan: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          badgeLabel: true,
          color: true
        }
      }
    },
    orderBy: { points: 'desc' as const }
  },
  entries: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: { totalPoints: 'desc' as const }
  },
  heroSlide: {
    select: {
      id: true,
      isActive: true,
      platform: true,
      imageUrl: true,
      sortOrder: true
    }
  }
} satisfies Prisma.RaffleInclude;

export class RafflesRepository {
  list(includeEnded = true) {
    return prisma.raffle.findMany({
      where: {
        deletedAt: null,
        ...(includeEnded ? {} : { status: { not: RaffleStatus.ENDED } })
      },
      select: raffleListSelect,
      orderBy: [{ startsAt: 'desc' }]
    });
  }

  findById(id: string) {
    return prisma.raffle.findFirst({
      where: { id, deletedAt: null },
      include: raffleDetailInclude
    });
  }

  findActiveForDate(date: Date) {
    return prisma.raffle.findFirst({
      where: {
        deletedAt: null,
        status: RaffleStatus.ACTIVE,
        startsAt: { lte: date },
        endsAt: { gte: date }
      },
      include: {
        planPoints: {
          include: {
            plan: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                badgeLabel: true,
                color: true
              }
            }
          },
          orderBy: { points: 'desc' }
        }
      }
    });
  }

  findActivePublic(date: Date) {
    return this.findActiveForDate(date);
  }

  getNextHeroSortOrder() {
    return prisma.heroSlide
      .aggregate({ _max: { sortOrder: true } })
      .then((result) => (result._max.sortOrder ?? -1) + 1);
  }

  updateHeroImageUrl(id: string, heroImageUrl: string) {
    return prisma.raffle.update({
      where: { id },
      data: { heroImageUrl }
    });
  }

  deactivateHeroSlideForRaffle(raffleId: string) {
    return prisma.heroSlide.updateMany({
      where: { raffleId },
      data: { isActive: false }
    });
  }

  async upsertHeroSlideForRaffle(
    raffleId: string,
    input: {
      imageUrl: string;
      platform: 'WEB' | 'MOBILE' | 'ALL';
      titleAr: string;
      titleEn: string;
      subtitleAr: string;
      subtitleEn: string;
      buttonLabelAr: string;
      buttonLabelEn: string;
      buttonLink: string;
      isActive: boolean;
      sortOrder?: number;
    }
  ) {
    const existing = await prisma.heroSlide.findUnique({ where: { raffleId } });
    const sortOrder = input.sortOrder ?? existing?.sortOrder ?? 0;

    if (existing) {
      return prisma.heroSlide.update({
        where: { id: existing.id },
        data: {
          sortOrder,
          platform: input.platform,
          imageUrl: input.imageUrl,
          titleAr: input.titleAr,
          titleEn: input.titleEn,
          subtitleAr: input.subtitleAr,
          subtitleEn: input.subtitleEn,
          buttonLabelAr: input.buttonLabelAr,
          buttonLabelEn: input.buttonLabelEn,
          buttonLink: input.buttonLink,
          isActive: input.isActive
        }
      });
    }

    return prisma.heroSlide.create({
      data: {
        raffleId,
        sortOrder,
        platform: input.platform,
        imageUrl: input.imageUrl,
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        subtitleAr: input.subtitleAr,
        subtitleEn: input.subtitleEn,
        buttonLabelAr: input.buttonLabelAr,
        buttonLabelEn: input.buttonLabelEn,
        buttonLink: input.buttonLink,
        isActive: input.isActive
      }
    });
  }

  async create(data: CreateRaffleDto) {
    return prisma.$transaction(async (tx) => {
      const raffle = await tx.raffle.create({
        data: {
          titleAr: data.titleAr,
          titleEn: data.titleEn,
          descriptionAr: data.descriptionAr,
          descriptionEn: data.descriptionEn,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          status: data.status ?? RaffleStatus.DRAFT,
          planPoints: {
            create: data.planPoints.map((item) => ({
              planId: item.planId,
              points: item.points
            }))
          }
        },
        include: raffleDetailInclude
      });

      return raffle;
    });
  }

  async update(id: string, data: UpdateRaffleDto) {
    return prisma.$transaction(async (tx) => {
      if (data.planPoints) {
        await tx.rafflePlanPoints.deleteMany({ where: { raffleId: id } });
        await tx.rafflePlanPoints.createMany({
          data: data.planPoints.map((item) => ({
            raffleId: id,
            planId: item.planId,
            points: item.points
          }))
        });
      }

      return tx.raffle.update({
        where: { id },
        data: {
          titleAr: data.titleAr,
          titleEn: data.titleEn,
          descriptionAr: data.descriptionAr,
          descriptionEn: data.descriptionEn,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          status: data.status
        },
        include: raffleDetailInclude
      });
    });
  }

  softDelete(id: string) {
    return prisma.raffle.update({
      where: { id },
      data: { deletedAt: new Date(), status: RaffleStatus.ENDED }
    });
  }

  deactivateOtherActiveRaffles(exceptId: string) {
    return prisma.raffle.updateMany({
      where: {
        id: { not: exceptId },
        deletedAt: null,
        status: RaffleStatus.ACTIVE
      },
      data: { status: RaffleStatus.ENDED }
    });
  }

  setStatus(id: string, status: RaffleStatus) {
    return prisma.raffle.update({
      where: { id },
      data: { status },
      include: raffleDetailInclude
    });
  }

  findPromotionForRaffle(promotionId: string) {
    return prisma.adPromotion.findFirst({
      where: { id: promotionId, deletedAt: null },
      include: {
        ad: {
          select: {
            id: true,
            userId: true,
            title: true,
            storeId: true
          }
        },
        plan: true
      }
    });
  }

  async awardPoints(input: {
    raffleId: string;
    userId: string;
    promotionId: string;
    planId: string;
    points: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.rafflePointTransaction.findUnique({
        where: { promotionId: input.promotionId }
      });
      if (existing) return null;

      await tx.rafflePointTransaction.create({
        data: {
          raffleId: input.raffleId,
          userId: input.userId,
          promotionId: input.promotionId,
          planId: input.planId,
          points: input.points
        }
      });

      return tx.raffleEntry.upsert({
        where: {
          raffleId_userId: {
            raffleId: input.raffleId,
            userId: input.userId
          }
        },
        create: {
          raffleId: input.raffleId,
          userId: input.userId,
          totalPoints: input.points
        },
        update: {
          totalPoints: { increment: input.points }
        }
      });
    });
  }
}

export const rafflesRepository = new RafflesRepository();
