import { StoreSubscriptionStatus } from '@prisma/client';

import { ErrorCodes } from '../../shared/constants/error-codes';
import { ApiError } from '../../shared/utils/api-error';
import { prisma } from '../../shared/prisma/client';
import { getSubscriptionEndDate } from './store-billing-period.utils';
import {
  countStoreListingsForBaseline,
  syncStoreListingPromotions
} from './store-listing-promotion.service';

export { getSubscriptionEndDate };

export async function reactivateStoreAds(storeId: string) {
  await prisma.ad.updateMany({
    where: { storeId, deletedAt: null, status: 'ACTIVE', isApproved: true },
    data: { isActive: true }
  });
}

export async function ensureStoreAccessAfterSubscription(storeId: string) {
  await prisma.store.update({
    where: { id: storeId },
    data: { isActive: true }
  });
  await reactivateStoreAds(storeId);
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
    await ensureStoreAccessAfterSubscription(subscription.storeId);
    await syncStoreListingPromotions(subscription.storeId);
    return subscription;
  }

  const startsAt = new Date();
  const endsAt = getTrialEndDate(trialDays, startsAt);
  const baselineListings = await countStoreListingsForBaseline(subscription.storeId);

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
        baselineListings,
        startsAt,
        endsAt,
        expiredNotifiedAt: null
      },
      include: { store: true, plan: true, pricing: true }
    });

    return row;
  });

  await ensureStoreAccessAfterSubscription(subscription.storeId);
  await syncStoreListingPromotions(subscription.storeId);
  return updated;
}

export async function extendStoreSubscription(subscriptionId: string) {
  const subscription = await prisma.storeSubscription.findFirst({
    where: { id: subscriptionId, deletedAt: null },
    include: { store: true }
  });

  if (!subscription || subscription.isTrial) return null;

  const now = new Date();
  const extensionBase =
    subscription.endsAt && subscription.endsAt > now ? subscription.endsAt : now;
  const endsAt = getSubscriptionEndDate(subscription.billingPeriod, extensionBase);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.storeSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: StoreSubscriptionStatus.ACTIVE,
        isActive: true,
        isTrial: false,
        endsAt,
        expiredNotifiedAt: null
      },
      include: { store: true, plan: true, pricing: true }
    });

    return row;
  });

  await ensureStoreAccessAfterSubscription(subscription.storeId);
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
    await ensureStoreAccessAfterSubscription(subscription.storeId);
    await syncStoreListingPromotions(subscription.storeId);
    return subscription;
  }

  const startsAt = new Date();
  const endsAt = getSubscriptionEndDate(subscription.billingPeriod, startsAt);
  const baselineListings = await countStoreListingsForBaseline(subscription.storeId);

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
        baselineListings,
        startsAt,
        endsAt,
        expiredNotifiedAt: null
      },
      include: { store: true, plan: true, pricing: true }
    });

    return row;
  });

  await ensureStoreAccessAfterSubscription(subscription.storeId);
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

export const SUBSCRIPTION_RENEWAL_WINDOW_DAYS = 2;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function canRenewActiveSubscription(endsAt: Date, now = new Date()) {
  const endsMs = endsAt.getTime();
  const nowMs = now.getTime();
  if (endsMs <= nowMs) return false;

  const windowMs = SUBSCRIPTION_RENEWAL_WINDOW_DAYS * MS_PER_DAY;
  return endsMs - nowMs <= windowMs;
}

export function assertCanRenewActiveSubscription(endsAt: Date) {
  if (!canRenewActiveSubscription(endsAt)) {
    throw new ApiError(
      400,
      'Subscription can only be renewed within 2 days before expiry',
      ErrorCodes.SUBSCRIPTION_RENEWAL_TOO_EARLY
    );
  }
}
