import { Worker } from 'bullmq';

import { redis } from '../config/redis';
import { expireDueStoreSubscriptions } from '../modules/stores/store-subscription-expiry.service';
import { prisma } from '../shared/prisma/client';
import { sendNotificationEmail } from '../shared/email/mailer';

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
          const user = await prisma.user.findFirst({
            where: { id: job.data.userId, deletedAt: null },
            select: { phone: true }
          });

          console.log('[notifications] whatsapp stub — integrate provider later', {
            phone: user?.phone,
            title: job.data.title,
            body: job.data.body
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
