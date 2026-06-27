import { NotificationType } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import { sendUserNotification } from '../notifications/send-user-notification';

const WARNING_DAYS = 3;

export type WarnExpiringPromotionsResult = {
  processed: number;
  notified: number;
};

export async function warnExpiringPromotions(now = new Date()): Promise<WarnExpiringPromotionsResult> {
  const warningEndsAt = new Date(now.getTime() + WARNING_DAYS * 24 * 60 * 60 * 1000);

  const due = await prisma.adPromotion.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      endsAt: { gt: now, lte: warningEndsAt },
      expiryWarningNotifiedAt: null
    },
    include: {
      ad: { select: { id: true, title: true, userId: true } },
      plan: { select: { nameAr: true, nameEn: true } }
    }
  });

  let notified = 0;

  for (const promotion of due) {
    const daysLeft = Math.max(1, Math.ceil((promotion.endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    await prisma.adPromotion.update({
      where: { id: promotion.id },
      data: { expiryWarningNotifiedAt: now }
    });

    try {
      await sendUserNotification({
        userId: promotion.ad.userId,
        type: NotificationType.PROMOTION_EXPIRING,
        title: {
          ar: 'تمييز الإعلان على وشك الانتهاء',
          en: 'Listing promotion expiring soon'
        },
        body: {
          ar: `تمييز إعلان "${promotion.ad.title}" (${promotion.plan.nameAr}) ينتهي خلال ${daysLeft} يوم/أيام. جدّد التمييز للاستمرار في الظهور.`,
          en: `Promotion for listing "${promotion.ad.title}" (${promotion.plan.nameEn}) expires in ${daysLeft} day(s). Renew to stay featured.`
        },
        metadata: {
          adId: promotion.ad.id,
          promotionId: promotion.id,
          daysLeft
        },
        channels: { inApp: true, email: true, whatsapp: false, push: true }
      });
      notified += 1;
    } catch (error) {
      console.error('[promotions] failed to send expiry warning', {
        promotionId: promotion.id,
        error
      });
    }
  }

  return { processed: due.length, notified };
}
