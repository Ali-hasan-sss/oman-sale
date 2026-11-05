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

  sendNewUserWelcome(
    userId: string,
    grants: Array<{ count: number; nameAr: string; nameEn: string }>
  ) {
    const gifted = grants.filter((grant) => grant.count > 0);
    const welcomeAr = 'نسعد بانضمامك إلى عمان سيل.';
    const welcomeEn = 'We are glad you joined Oman Sale.';

    const bodyAr =
      gifted.length === 0
        ? `${welcomeAr} يمكنك الآن تصفح الإعلانات ونشر إعلانك.`
        : `${welcomeAr} تم منحك ${gifted.map((grant) => `${arabicAdCount(grant.count)} «${grant.nameAr}»`).join(' و ')} مجاناً.`;

    const bodyEn =
      gifted.length === 0
        ? `${welcomeEn} You can browse listings and publish your own.`
        : `${welcomeEn} You have been granted ${joinEnglish(gifted.map((grant) => `${grant.count} «${grant.nameEn}» ${grant.count === 1 ? 'ad' : 'ads'}`))} for free.`;

    return sendUserNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: {
        ar: 'مرحباً بك في عمان سيل',
        en: 'Welcome to Oman Sale'
      },
      body: { ar: bodyAr, en: bodyEn },
      channels: { inApp: true, email: false, whatsapp: false, push: true }
    });
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

function arabicAdCount(count: number) {
  if (count === 1) return 'إعلاناً واحداً';
  if (count === 2) return 'إعلانين';
  if (count >= 3 && count <= 10) return `${count} إعلانات`;
  return `${count} إعلاناً`;
}

function joinEnglish(parts: string[]) {
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

export const notificationsService = new NotificationsService();
