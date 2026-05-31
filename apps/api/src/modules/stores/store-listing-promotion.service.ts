import { prisma } from '../../shared/prisma/client';
import { promotionsRepository } from '../promotions/promotions.repository';

export async function applyStoreListingPromotion(adId: string, storeId: string) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, deletedAt: null },
    include: {
      subscriptions: {
        where: { deletedAt: null, isActive: true, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          plan: {
            select: {
              id: true,
              promotionPlanId: true,
              promotionPlan: { select: { id: true, isActive: true, deletedAt: true } }
            }
          }
        }
      }
    }
  });

  const subscription = store?.subscriptions[0];
  if (!subscription?.endsAt || !subscription.plan.promotionPlanId) {
    return null;
  }

  const promotionPlan = subscription.plan.promotionPlan;
  if (!promotionPlan || promotionPlan.deletedAt || !promotionPlan.isActive) {
    return null;
  }

  return promotionsRepository.applyIncludedPromotion({
    adId,
    planId: subscription.plan.promotionPlanId,
    endsAt: subscription.endsAt
  });
}

export async function syncStoreListingPromotions(storeId: string) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, deletedAt: null },
    include: {
      subscriptions: {
        where: { deletedAt: null, isActive: true, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          plan: {
            select: {
              promotionPlanId: true,
              promotionPlan: { select: { id: true, isActive: true, deletedAt: true } }
            }
          }
        }
      }
    }
  });

  const subscription = store?.subscriptions[0];
  if (!subscription?.endsAt || !subscription.plan.promotionPlanId) {
    return { updated: 0 };
  }

  const promotionPlan = subscription.plan.promotionPlan;
  if (!promotionPlan || promotionPlan.deletedAt || !promotionPlan.isActive) {
    return { updated: 0 };
  }

  const ads = await prisma.ad.findMany({
    where: {
      storeId,
      deletedAt: null,
      status: 'ACTIVE',
      isApproved: true
    },
    select: { id: true }
  });

  await Promise.all(
    ads.map((ad) =>
      promotionsRepository.applyIncludedPromotion({
        adId: ad.id,
        planId: subscription.plan.promotionPlanId!,
        endsAt: subscription.endsAt!
      })
    )
  );

  return { updated: ads.length };
}

export function resolveStoreListingLimit(subscription: {
  isTrial: boolean;
  maxListings: number;
  plan: { trialMaxListings: number; trialDays: number };
}) {
  if (subscription.isTrial) {
    if (subscription.plan.trialMaxListings > 0) {
      return subscription.plan.trialMaxListings;
    }
    return subscription.maxListings;
  }

  return subscription.maxListings;
}
