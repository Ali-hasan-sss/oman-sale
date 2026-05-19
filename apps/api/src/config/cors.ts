import type { CorsOptions } from 'cors';

import { env } from './env';

/** Private/LAN origins used during local development (any port). */
const DEV_LAN_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i;

const parseExtraOrigins = () =>
  (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const isOriginAllowed = (origin: string) => {
  const allowed = new Set([env.WEB_URL, ...parseExtraOrigins()]);
  if (allowed.has(origin)) return true;
  if (env.NODE_ENV === 'development' && env.CORS_ALLOW_LAN_IN_DEV && DEV_LAN_ORIGIN.test(origin)) {
    return true;
  }
  return false;
};

export const resolveCorsOrigin: CorsOptions['origin'] = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  if (env.NODE_ENV === 'development') {
    console.warn('[CORS] blocked origin:', origin);
  }

  callback(new Error(`CORS blocked origin: ${origin}`));
};

export const corsOptions: CorsOptions = {
  origin: resolveCorsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Device-Id',
    'X-Viewer-Id',
    'X-Client-Source',
    'Accept',
    'Origin'
  ]
};
