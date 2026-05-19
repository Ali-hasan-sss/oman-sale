import Redis from 'ioredis';

import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

export const socketPubClient = new Redis(env.REDIS_URL);
export const socketSubClient = socketPubClient.duplicate();
