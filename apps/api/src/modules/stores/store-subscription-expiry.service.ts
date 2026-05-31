import { StoreSubscriptionStatus } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import { sendUserNotification } from '../notifications/send-user-notification';
import { getSubscriptionEndDate } from './store-subscription.utils';

export type ExpireSubscriptionsResult = {
  processed: number;
  notified: number;
};

export async function expireDueStoreSubscriptions(now = new Date()): Promise<ExpireSubscriptionsResult> {
  const due = await prisma.storeSubscription.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      status: StoreSubscriptionStatus.ACTIVE,
      endsAt: { lte: now },
      expiredNotifiedAt: null
    },
    include: {
      store: { select: { id: true, userId: true, nameAr: true, nameEn: true, isActive: true } },
      plan: { select: { nameAr: true, nameEn: true } }
    }
  });

  let notified = 0;

  for (const subscription of due) {
    await prisma.$transaction(async (tx) => {
      await tx.storeSubscription.update({
        where: { id: subscription.id },
        data: {
          isActive: false,
          status: StoreSubscriptionStatus.EXPIRED,
          expiredNotifiedAt: now
        }
      });

      await tx.store.update({
        where: { id: subscription.storeId },
        data: { isActive: false }
      });

      await tx.ad.updateMany({
        where: { storeId: subscription.storeId, deletedAt: null },
        data: { isActive: false }
      });
    });

    try {
      await notifyStoreSubscriptionExpired({
        userId: subscription.store.userId,
        storeNameAr: subscription.store.nameAr,
        storeNameEn: subscription.store.nameEn,
        planNameAr: subscription.plan.nameAr,
        planNameEn: subscription.plan.nameEn,
        isTrial: subscription.isTrial
      });
      notified += 1;
    } catch (error) {
      console.error('[store-subscriptions] failed to notify expiry', {
        subscriptionId: subscription.id,
        error
      });
    }
  }

  return { processed: due.length, notified };
}

export async function notifyStoreSubscriptionExpired(input: {
  userId: string;
  storeNameAr: string;
  storeNameEn: string;
  planNameAr: string;
  planNameEn: string;
  isTrial: boolean;
}) {
  const isTrial = input.isTrial;

  await sendUserNotification({
    userId: input.userId,
    type: isTrial ? 'STORE_TRIAL_EXPIRED' : 'STORE_SUBSCRIPTION_EXPIRED',
    title: isTrial
      ? {
          ar: 'انتهت الفترة التجريبية للمتجر',
          en: 'Store trial period ended'
        }
      : {
          ar: 'انتهى اشتراك المتجر',
          en: 'Store subscription expired'
        },
    body: isTrial
      ? {
          ar: `انتهت الفترة التجريبية لمتجر "${input.storeNameAr}" (${input.planNameAr}). تم تعطيل المتجر وإخفاء إعلاناته. أكمل الدفع لتفعيل الاشتراك.`,
          en: `The trial for store "${input.storeNameEn}" (${input.planNameEn}) has ended. The store and its listings are disabled. Complete payment to reactivate.`
        }
      : {
          ar: `انتهى اشتراك متجر "${input.storeNameAr}" (${input.planNameAr}). تم تعطيل المتجر وإخفاء إعلاناته. جدّد الاشتراك للاستمرار.`,
          en: `The subscription for store "${input.storeNameEn}" (${input.planNameEn}) has expired. The store and its listings are disabled. Renew to continue.`
        },
    channels: { inApp: true, email: true, whatsapp: true }
  });
}

export async function reactivateStoreAds(storeId: string) {
  await prisma.ad.updateMany({
    where: { storeId, deletedAt: null, status: 'ACTIVE', isApproved: true },
    data: { isActive: true }
  });
}

export { getSubscriptionEndDate };
