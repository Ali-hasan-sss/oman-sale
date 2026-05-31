import { NotificationType } from '@prisma/client';

import { notificationsRepository } from './notifications.repository';
import { sendUserNotification, type SendUserNotificationInput } from './send-user-notification';

export class NotificationsService {
  listForUser(userId: string) {
    return notificationsRepository.listForUser(userId);
  }

  create(input: SendUserNotificationInput) {
    return sendUserNotification(input);
  }

  sendAccountBlockedNotification(userId: string) {
    return sendUserNotification({
      userId,
      type: NotificationType.ACCOUNT_BLOCKED,
      title: {
        ar: 'تم حظر حسابك',
        en: 'Your account has been blocked'
      },
      body: {
        ar: 'تم حظر حسابك من قبل الإدارة. لم يعد بإمكانك نشر الإعلانات أو استخدام ميزات المنصة. للاستفسار تواصل مع الدعم.',
        en: 'Your account was blocked by administration. You can no longer publish listings or use platform features. Contact support for help.'
      },
      channels: { inApp: true, email: true, whatsapp: false }
    });
  }

  markRead(id: string, userId: string) {
    return notificationsRepository.markRead(id, userId);
  }
}

export const notificationsService = new NotificationsService();
