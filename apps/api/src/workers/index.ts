import { Worker } from 'bullmq';

import { env } from '../config/env';
import { redis } from '../config/redis';
import { expireDueStoreSubscriptions } from '../modules/stores/store-subscription-expiry.service';
import { prisma } from '../shared/prisma/client';
import { sendNotificationEmail } from '../shared/email/mailer';
import { sendWhatsAppNotificationTemplate, sendWhatsAppOtpTemplate } from '../shared/whatsapp/whatsapp-client';
import { isWhatsAppConfigured } from '../shared/whatsapp/whatsapp-config';

const createWorker = (queueName: string) =>
  new Worker(
    queueName,
    async (job) => {
      if (queueName === 'notifications') {
        if (job.name === 'deliver-in-app-notification') {
          console.log('[notifications] in-app delivered', job.data.notificationId);
          return;
        }

        if (job.name === 'deliver-email-notification') {
          const user = await prisma.user.findFirst({
            where: { id: job.data.userId, deletedAt: null },
            select: { email: true }
          });

          if (!user?.email) return;

          const title = job.data.title as { ar: string; en: string };
          const body = job.data.body as { ar: string; en: string };
          await sendNotificationEmail(user.email, `Oman Sale - ${title.ar}`, title.ar, body.ar, 'ar').catch(
            () => undefined
          );
          return;
        }

        if (job.name === 'deliver-whatsapp-notification') {
          if (!isWhatsAppConfigured()) {
            console.warn('[whatsapp] notification skipped — WhatsApp is not configured');
            return;
          }

          const user = await prisma.user.findFirst({
            where: { id: job.data.userId, deletedAt: null },
            select: { phone: true }
          });

          if (!user?.phone) return;

          const title = job.data.title as { ar: string; en: string };
          const body = job.data.body as { ar: string; en: string };
          const templateName = env.WHATSAPP_NOTIFICATION_TEMPLATE_NAME;

          if (!templateName) {
            console.warn('[whatsapp] notification skipped — set WHATSAPP_NOTIFICATION_TEMPLATE_NAME for outbound alerts');
            return;
          }

          await sendWhatsAppNotificationTemplate({
            phone: user.phone,
            templateName,
            languageCode: env.WHATSAPP_NOTIFICATION_TEMPLATE_LANGUAGE,
            bodyParameters: [title.ar, body.ar]
          });
          return;
        }

        if (job.name === 'deliver-whatsapp-auth-code') {
          if (!isWhatsAppConfigured()) {
            console.error('[whatsapp] auth code job skipped — WhatsApp is not configured');
            return;
          }

          await sendWhatsAppOtpTemplate({
            phone: job.data.phone as string,
            code: job.data.code as string,
            locale: (job.data.locale as 'ar' | 'en' | undefined) ?? 'ar'
          });
          return;
        }
      }

      if (queueName === 'store-subscriptions') {
        if (job.name === 'expire-subscriptions') {
          const result = await expireDueStoreSubscriptions();
          console.log('[store-subscriptions] expiry job finished', result);
          return;
        }
      }

      console.log(`Processing ${queueName} job`, job.name, job.id);
    },
    { connection: redis }
  );

export const workers = [
  createWorker('emails'),
  createWorker('notifications'),
  createWorker('image-processing'),
  createWorker('store-subscriptions')
];
