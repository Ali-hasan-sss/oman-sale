import { prisma } from '../../shared/prisma/client';
import { notificationsService } from '../notifications/notifications.service';

export async function grantNewUserPromotionCredits(userId: string) {
  const plans = await prisma.promotionPlan.findMany({
    where: { deletedAt: null, isActive: true, freeAdsForNewUsers: { gt: 0 } },
    select: { id: true, freeAdsForNewUsers: true, name: true, nameAr: true, nameEn: true },
    orderBy: { priorityScore: 'asc' }
  });

  if (plans.length > 0) {
    await prisma.userPromotionCredit.createMany({
      data: plans.map((plan) => ({
        userId,
        planId: plan.id,
        remaining: plan.freeAdsForNewUsers
      })),
      skipDuplicates: true
    });
  }

  try {
    await notificationsService.sendNewUserWelcome(
      userId,
      plans.map((plan) => ({
        count: plan.freeAdsForNewUsers,
        nameAr: plan.nameAr.trim() || plan.name,
        nameEn: plan.nameEn.trim() || plan.name
      }))
    );
  } catch (error) {
    console.error('[notifications] failed to send new-user welcome', error);
  }
}

export async function listNewUserPromotionCredits(userId: string) {
  const credits = await prisma.userPromotionCredit.findMany({
    where: {
      userId,
      remaining: { gt: 0 },
      plan: { deletedAt: null, isActive: true }
    },
    select: {
      planId: true,
      remaining: true,
      plan: { select: { freeAdDurationDays: true, nameAr: true, nameEn: true } }
    }
  });

  return credits.map((credit) => ({
    planId: credit.planId,
    remaining: credit.remaining,
    durationDays: Math.max(1, credit.plan.freeAdDurationDays),
    nameAr: credit.plan.nameAr,
    nameEn: credit.plan.nameEn
  }));
}

/** Decrements one free credit. Returns the promotion length, or null when none remain. */
export async function takeNewUserPromotionCredit(userId: string, planId: string) {
  const plan = await prisma.promotionPlan.findFirst({
    where: { id: planId, deletedAt: null, isActive: true },
    select: { freeAdDurationDays: true }
  });
  if (!plan) return null;

  const updated = await prisma.userPromotionCredit.updateMany({
    where: { userId, planId, remaining: { gt: 0 } },
    data: { remaining: { decrement: 1 } }
  });
  if (updated.count !== 1) return null;

  return { days: Math.max(1, plan.freeAdDurationDays) };
}

export async function refundNewUserPromotionCredit(userId: string, planId: string) {
  await prisma.userPromotionCredit.updateMany({
    where: { userId, planId },
    data: { remaining: { increment: 1 } }
  });
}
