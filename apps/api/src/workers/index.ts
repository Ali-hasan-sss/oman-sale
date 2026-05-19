import { Worker } from 'bullmq';

import { redis } from '../config/redis';

const createWorker = (queueName: string) =>
  new Worker(
    queueName,
    async (job) => {
      console.log(`Processing ${queueName} job`, job.name, job.id);
    },
    { connection: redis }
  );

export const workers = [
  createWorker('emails'),
  createWorker('notifications'),
  createWorker('image-processing')
];
