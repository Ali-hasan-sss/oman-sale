import { notificationQueue, storeSubscriptionsQueue } from '../config/queues';

export async function registerScheduledJobs() {
  await storeSubscriptionsQueue.add(
    'expire-subscriptions',
    {},
    {
      jobId: 'expire-store-subscriptions',
      repeat: { pattern: '*/15 * * * *' },
      removeOnComplete: true,
      removeOnFail: 100
    }
  );

  console.log('[scheduler] store subscription expiry job registered (every 15 minutes)');
}

export async function safeQueueNotificationJob(name: string, data: Record<string, unknown>) {
  try {
    await notificationQueue.add(name, data);
  } catch (error) {
    console.error(`[notifications] failed to queue ${name}`, error);
  }
}
