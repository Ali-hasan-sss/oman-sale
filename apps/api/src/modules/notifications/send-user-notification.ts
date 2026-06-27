import { NotificationType } from '@prisma/client';

import { notificationQueue } from '../../config/queues';
import { emitInAppNotification } from './emit-notification';
import { notificationsRepository } from './notifications.repository';

export type LocalizedNotificationText = {
  ar: string;
  en: string;
};

export type NotificationDeliveryChannels = {
  inApp?: boolean;
  email?: boolean;
  whatsapp?: boolean;
  push?: boolean;
};

export type SendUserNotificationInput = {
  userId: string;
  type: NotificationType;
  title: LocalizedNotificationText;
  body: LocalizedNotificationText;
  metadata?: Record<string, unknown>;
  channels?: NotificationDeliveryChannels;
};

const defaultChannels: Required<NotificationDeliveryChannels> = {
  inApp: true,
  email: false,
  whatsapp: false,
  push: true
};

async function safeQueue(name: string, data: Record<string, unknown>) {
  try {
    await notificationQueue.add(name, data);
  } catch (error) {
    console.error(`[notifications] failed to queue ${name}`, error);
  }
}

export async function sendUserNotification(input: SendUserNotificationInput) {
  const channels = { ...defaultChannels, ...input.channels };
  let notificationId: string | undefined;

  if (channels.inApp) {
    try {
      const notification = await notificationsRepository.create({
        userId: input.userId,
        type: input.type,
        title: input.title.ar,
        body: input.body.ar,
        metadata: {
          titleEn: input.title.en,
          bodyEn: input.body.en,
          channels,
          ...(input.metadata ?? {})
        }
      });
      notificationId = notification.id;

      // Emit in real time directly from the API process. The socket server only
      // exists in this process, so emitting here (instead of from a separate
      // worker process where `io` is undefined) guarantees instant delivery.
      try {
        await emitInAppNotification(notification.id);
      } catch (emitError) {
        console.error('[notifications] failed to emit in-app notification', emitError);
        // Fallback to the queue so a running worker can retry the emit.
        await safeQueue('deliver-in-app-notification', { notificationId: notification.id });
      }
    } catch (error) {
      console.error('[notifications] failed to create in-app notification', error);
    }
  }

  if (channels.push) {
    await safeQueue('deliver-push-notification', {
      userId: input.userId,
      notificationId,
      type: input.type,
      title: input.title,
      body: input.body
    });
  }

  if (channels.email) {
    await safeQueue('deliver-email-notification', {
      userId: input.userId,
      notificationId,
      type: input.type,
      title: input.title,
      body: input.body
    });
  }

  if (channels.whatsapp) {
    await safeQueue('deliver-whatsapp-notification', {
      userId: input.userId,
      notificationId,
      type: input.type,
      title: input.title,
      body: input.body
    });
  }

  return { notificationId, channels };
}
