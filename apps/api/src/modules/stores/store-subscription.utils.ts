import { StoreBillingPeriod, StoreSubscriptionStatus } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import { syncStoreListingPromotions } from './store-listing-promotion.service';

export function getSubscriptionEndDate(billingPeriod: StoreBillingPeriod, startsAt = new Date()) {
  const endsAt = new Date(startsAt);
  if (billingPeriod === StoreBillingPeriod.MONTHLY) {
    endsAt.setMonth(endsAt.getMonth() + 1);
  } else {
    endsAt.setFullYear(endsAt.getFullYear() + 1);
  }
  return endsAt;
}

export function getTrialEndDate(trialDays: number, startsAt = new Date()) {
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + trialDays);
  return endsAt;
}

export async function activateStoreTrialSubscription(subscriptionId: string, trialDays: number) {
  const subscription = await prisma.storeSubscription.findFirst({
    where: { id: subscriptionId, deletedAt: null },
    include: { store: true }
  });

  if (!subscription) return null;
  if (subscription.status === StoreSubscriptionStatus.ACTIVE && subscription.isActive) {
    return subscription;
  }

  const startsAt = new Date();
  const endsAt = getTrialEndDate(trialDays, startsAt);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.storeSubscription.updateMany({
      where: {
        storeId: subscription.storeId,
        deletedAt: null,
        isActive: true,
        id: { not: subscriptionId }
      },
      data: { isActive: false, status: StoreSubscriptionStatus.CANCELLED }
    });

    const row = await tx.storeSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: StoreSubscriptionStatus.ACTIVE,
        isActive: true,
        isTrial: true,
        startsAt,
        endsAt,
        expiredNotifiedAt: null
      },
      include: { store: true, plan: true, pricing: true }
    });

    await tx.store.update({
      where: { id: subscription.storeId },
      data: { isActive: true }
    });

    return row;
  });

  await syncStoreListingPromotions(subscription.storeId);
  return updated;
}

export async function activateStoreSubscription(subscriptionId: string) {
  const subscription = await prisma.storeSubscription.findFirst({
    where: { id: subscriptionId, deletedAt: null },
    include: { store: true }
  });

  if (!subscription) return null;
  if (
    subscription.status === StoreSubscriptionStatus.ACTIVE &&
    subscription.isActive &&
    !subscription.isTrial
  ) {
    return subscription;
  }

  const startsAt = new Date();
  const endsAt = getSubscriptionEndDate(subscription.billingPeriod, startsAt);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.storeSubscription.updateMany({
      where: {
        storeId: subscription.storeId,
        deletedAt: null,
        isActive: true,
        id: { not: subscriptionId }
      },
      data: { isActive: false, status: StoreSubscriptionStatus.CANCELLED }
    });

    const row = await tx.storeSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: StoreSubscriptionStatus.ACTIVE,
        isActive: true,
        isTrial: false,
        startsAt,
        endsAt,
        expiredNotifiedAt: null
      },
      include: { store: true, plan: true, pricing: true }
    });

    await tx.store.update({
      where: { id: subscription.storeId },
      data: { isActive: true }
    });

    await tx.ad.updateMany({
      where: { storeId: subscription.storeId, deletedAt: null, status: 'ACTIVE', isApproved: true },
      data: { isActive: true }
    });

    return row;
  });

  await syncStoreListingPromotions(subscription.storeId);
  return updated;
}

export async function findStoreSubscriptionByReference(referenceId: string) {
  return prisma.storeSubscription.findFirst({
    where: { id: referenceId, deletedAt: null },
    include: { store: true, plan: true, pricing: true, payment: true }
  });
}

export function getStoreAccessStatus(store: {
  isActive: boolean;
  subscriptions: Array<{
    status: StoreSubscriptionStatus;
    isActive: boolean;
    isTrial: boolean;
    endsAt: Date | null;
  }>;
}) {
  const now = new Date();
  const activeSubscription = store.subscriptions.find(
    (subscription) =>
      subscription.isActive &&
      subscription.status === StoreSubscriptionStatus.ACTIVE &&
      subscription.endsAt &&
      subscription.endsAt > now
  );

  if (store.isActive && activeSubscription) {
    return activeSubscription.isTrial ? 'TRIAL' : 'ACTIVE';
  }

  const expiredSubscription = store.subscriptions.find(
    (subscription) =>
      subscription.status === StoreSubscriptionStatus.EXPIRED ||
      (subscription.endsAt && subscription.endsAt <= now && subscription.status !== StoreSubscriptionStatus.CANCELLED)
  );

  if (expiredSubscription) {
    return expiredSubscription.isTrial ? 'TRIAL_EXPIRED' : 'SUBSCRIPTION_EXPIRED';
  }

  return store.isActive ? 'ACTIVE' : 'DISABLED';
}
