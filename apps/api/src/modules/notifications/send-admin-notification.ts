import { NotificationType, UserRole } from '@prisma/client';

import { env } from '../../config/env';
import { notificationQueue } from '../../config/queues';
import { prisma } from '../../shared/prisma/client';
import { sendNotificationEmail } from '../../shared/email/mailer';
import type { LocalizedNotificationText } from './send-user-notification';
import { sendUserNotification } from './send-user-notification';

export type SendAdminNotificationInput = {
  type: NotificationType;
  title: LocalizedNotificationText;
  body: LocalizedNotificationText;
  metadata?: Record<string, unknown>;
};

async function safeQueue(name: string, data: Record<string, unknown>) {
  try {
    await notificationQueue.add(name, data);
  } catch (error) {
    console.error(`[notifications] failed to queue ${name}`, error);
  }
}

export async function sendAdminNotification(input: SendAdminNotificationInput) {
  const adminEmail = env.ADMIN_NOTIFICATION_EMAIL;

  await safeQueue('deliver-admin-email-notification', {
    email: adminEmail,
    type: input.type,
    title: input.title,
    body: input.body
  });

  const staff = await prisma.user.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      isBlocked: false,
      role: { in: [UserRole.ADMIN, UserRole.MODERATOR] }
    },
    select: { id: true }
  });

  if (staff.length === 0) {
    console.warn(
      '[notifications] no active ADMIN/MODERATOR recipients found for admin notification',
      { type: input.type }
    );
    return;
  }

  console.log('[notifications] dispatching admin notification', {
    type: input.type,
    recipients: staff.length,
    email: adminEmail
  });

  await Promise.all(
    staff.map((user) =>
      sendUserNotification({
        userId: user.id,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata,
        channels: { inApp: true, email: false, whatsapp: false, push: true }
      }).catch((error) => {
        console.error('[notifications] failed to notify admin user', { userId: user.id, error });
      })
    )
  );
}

export async function deliverAdminEmailNotification(input: {
  email: string;
  title: LocalizedNotificationText;
  body: LocalizedNotificationText;
}) {
  await sendNotificationEmail(
    input.email,
    `Oman Sale Admin - ${input.title.ar}`,
    input.title.ar,
    input.body.ar,
    'ar'
  ).catch((error) => {
    console.error('[notifications] failed to deliver admin email', { email: input.email, error });
  });
}
