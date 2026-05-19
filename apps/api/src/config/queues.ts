import { Queue } from 'bullmq';

import { redis } from './redis';

export const emailQueue = new Queue('emails', { connection: redis });
export const notificationQueue = new Queue('notifications', { connection: redis });
export const imageProcessingQueue = new Queue('image-processing', { connection: redis });
