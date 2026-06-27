import { Worker } from 'bullmq';

import { env } from '../config/env';
import { redis } from '../config/redis';
import { emitInAppNotification } from '../modules/notifications/emit-notification';
import { pushTokensRepository } from '../modules/notifications/push-tokens.repository';
import { deliverAdminEmailNotification } from '../modules/notifications/send-admin-notification';
import { warnExpiringPromotions } from '../modules/promotions/promotion-expiry-warnings.service';
import { warnExpiringStoreSubscriptions } from '../modules/stores/store-subscription-expiry-warnings.service';
import { expireDueStoreSubscriptions } from '../modules/stores/store-subscription-expiry.service';
import { prisma } from '../shared/prisma/client';
import { sendNotificationEmail } from '../shared/email/mailer';
import { sendFcmToTokens } from '../shared/firebase/fcm';
import { startPhoneVerification } from '../shared/sms/twilio-verify-client';
import { isTwilioConfigured } from '../shared/sms/twilio-config';
import { sendWhatsAppNotificationTemplate } from '../shared/whatsapp/whatsapp-client';
import { isWhatsAppConfigured } from '../shared/whatsapp/whatsapp-config';

const createWorker = (queueName: string) =>
  new Worker(
    queueName,
    async (job) => {
      if (queueName === 'notifications') {
        if (job.name === 'deliver-in-app-notification') {
          await emitInAppNotification(job.data.notificationId as string);
          return;
        }

        if (job.name === 'deliver-push-notification') {
          const userId = job.data.userId as string;
          const title = job.data.title as { ar: string; en: string };
          const body = job.data.body as { ar: string; en: string };
          const notificationId = job.data.notificationId as string | undefined;

          const tokens = await pushTokensRepository.listForUser(userId);
          if (tokens.length === 0) return;

          const result = await sendFcmToTokens(
            tokens.map((entry) => entry.token),
            {
              title: title.ar,
              body: body.ar,
              data: {
                ...(notificationId ? { notificationId } : {}),
                type: String(job.data.type ?? '')
              }
            }
          );

          if (result.invalidTokens.length > 0) {
            await pushTokensRepository.removeTokens(result.invalidTokens);
          }
          return;
        }

        if (job.name === 'deliver-admin-email-notification') {
          const title = job.data.title as { ar: string; en: string };
          const body = job.data.body as { ar: string; en: string };
          await deliverAdminEmailNotification({
            email: job.data.email as string,
            title,
            body
          });
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

        if (job.name === 'start-twilio-verify') {
          if (!isTwilioConfigured()) {
            console.error('[twilio-verify] job skipped — Twilio Verify is not configured');
            return;
          }

          const channel = (job.data.channel as 'whatsapp' | 'sms' | undefined) ?? 'whatsapp';
          await startPhoneVerification(job.data.phone as string, channel);
          return;
        }
      }

      if (queueName === 'store-subscriptions') {
        if (job.name === 'expire-subscriptions') {
          const result = await expireDueStoreSubscriptions();
          console.log('[store-subscriptions] expiry job finished', result);
          return;
        }

        if (job.name === 'warn-expiring-subscriptions') {
          const result = await warnExpiringStoreSubscriptions();
          console.log('[store-subscriptions] expiry warning job finished', result);
          return;
        }

        if (job.name === 'warn-expiring-promotions') {
          const result = await warnExpiringPromotions();
          console.log('[promotions] expiry warning job finished', result);
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
