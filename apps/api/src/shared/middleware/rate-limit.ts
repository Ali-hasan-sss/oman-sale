import type { RequestHandler } from 'express';

import { env } from '../../config/env';
import { redis } from '../../config/redis';

export const apiRateLimiter: RequestHandler = async (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const windowSeconds = Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000);
  const key = `rate-limit:${ip}`;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);

  res.setHeader('RateLimit-Limit', env.RATE_LIMIT_MAX);
  res.setHeader('RateLimit-Remaining', Math.max(env.RATE_LIMIT_MAX - count, 0));

  if (count > env.RATE_LIMIT_MAX) {
    return res.status(429).json({ message: 'Too many requests' });
  }

  return next();
};
