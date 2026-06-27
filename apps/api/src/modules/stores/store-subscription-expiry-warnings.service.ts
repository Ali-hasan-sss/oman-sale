import { NotificationType, StoreSubscriptionStatus } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import { sendUserNotification } from '../notifications/send-user-notification';

const WARNING_DAYS = 7;

export type WarnExpiringSubscriptionsResult = {
  processed: number;
  notified: number;
};

export async function warnExpiringStoreSubscriptions(now = new Date()): Promise<WarnExpiringSubscriptionsResult> {
  const warningEndsAt = new Date(now.getTime() + WARNING_DAYS * 24 * 60 * 60 * 1000);

  const due = await prisma.storeSubscription.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      status: StoreSubscriptionStatus.ACTIVE,
      endsAt: { gt: now, lte: warningEndsAt },
      expiryWarningNotifiedAt: null
    },
    include: {
      store: { select: { id: true, userId: true, nameAr: true, nameEn: true } },
      plan: { select: { nameAr: true, nameEn: true } }
    }
  });

  let notified = 0;

  for (const subscription of due) {
    if (!subscription.endsAt) continue;

    const daysLeft = Math.max(1, Math.ceil((subscription.endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    await prisma.storeSubscription.update({
      where: { id: subscription.id },
      data: { expiryWarningNotifiedAt: now }
    });

    try {
      await sendUserNotification({
        userId: subscription.store.userId,
        type: NotificationType.STORE_SUBSCRIPTION_EXPIRING,
        title: {
          ar: 'اشتراك المتجر على وشك الانتهاء',
          en: 'Store subscription expiring soon'
        },
        body: {
          ar: `اشتراك متجر "${subscription.store.nameAr}" (${subscription.plan.nameAr}) ينتهي خلال ${daysLeft} يوم/أيام. جدّد الآن لتجنب تعطيل المتجر.`,
          en: `The subscription for store "${subscription.store.nameEn}" (${subscription.plan.nameEn}) expires in ${daysLeft} day(s). Renew now to avoid deactivation.`
        },
        metadata: {
          storeId: subscription.store.id,
          subscriptionId: subscription.id,
          daysLeft
        },
        channels: { inApp: true, email: true, whatsapp: false, push: true }
      });
      notified += 1;
    } catch (error) {
      console.error('[store-subscriptions] failed to send expiry warning', {
        subscriptionId: subscription.id,
        error
      });
    }
  }

  return { processed: due.length, notified };
}
