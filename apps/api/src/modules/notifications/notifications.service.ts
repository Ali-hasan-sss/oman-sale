import { NotificationType, type PushPlatform } from '@prisma/client';

import { notificationsRepository } from './notifications.repository';
import { pushTokensRepository } from './push-tokens.repository';
import { sendUserNotification, type SendUserNotificationInput } from './send-user-notification';

export class NotificationsService {
  listForUser(userId: string) {
    return notificationsRepository.listForUser(userId);
  }

  unreadCount(userId: string) {
    return notificationsRepository.unreadCount(userId);
  }

  create(input: SendUserNotificationInput) {
    return sendUserNotification(input);
  }

  registerPushToken(userId: string, token: string, platform: PushPlatform) {
    return pushTokensRepository.upsert(userId, token, platform);
  }

  removePushToken(userId: string, token: string) {
    return pushTokensRepository.remove(userId, token);
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
      channels: { inApp: true, email: true, whatsapp: false, push: true }
    });
  }

  sendAccountDisabledNotification(userId: string) {
    return sendUserNotification({
      userId,
      type: NotificationType.ACCOUNT_DISABLED,
      title: {
        ar: 'تم تعطيل حسابك',
        en: 'Your account has been disabled'
      },
      body: {
        ar: 'تم تعطيل حسابك من قبل الإدارة. تواصل مع الدعم لمعرفة السبب وإعادة التفعيل.',
        en: 'Your account was disabled by administration. Contact support to learn why and request reactivation.'
      },
      channels: { inApp: true, email: true, whatsapp: false, push: true }
    });
  }

  markRead(id: string, userId: string) {
    return notificationsRepository.markRead(id, userId);
  }

  markAllRead(userId: string) {
    return notificationsRepository.markAllRead(userId);
  }
}

export const notificationsService = new NotificationsService();
