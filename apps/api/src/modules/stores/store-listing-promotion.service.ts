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
    await promotionsRepository.clearIncludedPromotion(adId);
    return null;
  }

  const promotionPlan = subscription.plan.promotionPlan;
  if (!promotionPlan || promotionPlan.deletedAt || !promotionPlan.isActive) {
    await promotionsRepository.clearIncludedPromotion(adId);
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
    const cleared = await promotionsRepository.clearStoreIncludedPromotions(storeId);
    return { updated: 0, cleared: cleared.count };
  }

  const promotionPlan = subscription.plan.promotionPlan;
  if (!promotionPlan || promotionPlan.deletedAt || !promotionPlan.isActive) {
    const cleared = await promotionsRepository.clearStoreIncludedPromotions(storeId);
    return { updated: 0, cleared: cleared.count };
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
  baselineListings?: number;
  plan: { trialMaxListings: number; trialDays: number };
}) {
  const baseline = subscription.baselineListings ?? 0;
  const planAllowance =
    subscription.isTrial && subscription.plan.trialMaxListings > 0
      ? subscription.plan.trialMaxListings
      : subscription.maxListings;

  return baseline + planAllowance;
}

export async function countStoreListingsForBaseline(storeId: string) {
  return prisma.ad.count({
    where: { storeId, deletedAt: null, status: 'ACTIVE' }
  });
}
