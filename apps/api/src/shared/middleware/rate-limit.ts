import type { Request, RequestHandler } from 'express';

import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { ErrorCodes } from '../constants/error-codes';

export const apiRateLimiter: RequestHandler = async (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const windowSeconds = Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000);
  const key = `rate-limit:${ip}`;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);

  res.setHeader('RateLimit-Limit', env.RATE_LIMIT_MAX);
  res.setHeader('RateLimit-Remaining', Math.max(env.RATE_LIMIT_MAX - count, 0));

  if (count > env.RATE_LIMIT_MAX) {
    return res.status(429).json({
      message: 'Too many requests',
      code: ErrorCodes.RATE_LIMITED
    });
  }

  return next();
};

const AUTH_WINDOW_SECONDS = 15 * 60;

async function countAttempt(key: string, windowSeconds: number) {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  return count;
}

function requestIp(req: Request) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function requestEmail(req: Request) {
  const email = req.body?.email;
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function rejectAuthAttempt(res: Parameters<RequestHandler>[1]) {
  res.setHeader('Retry-After', String(AUTH_WINDOW_SECONDS));
  return res.status(429).json({
    message: 'Too many attempts. Please wait and try again.',
    code: ErrorCodes.RATE_LIMITED
  });
}

/** Stricter than the global API limit. Counts by IP and, when present, by email. */
export function createAuthAttemptLimiter(options: {
  scope: 'login' | 'forgot-password' | 'reset-password';
  maxPerIp: number;
  maxPerEmail: number;
}): RequestHandler {
  return async (req, res, next) => {
    const ipCount = await countAttempt(`auth-limit:${options.scope}:ip:${requestIp(req)}`, AUTH_WINDOW_SECONDS);
    if (ipCount > options.maxPerIp) return rejectAuthAttempt(res);

    const email = requestEmail(req);
    if (email) {
      const emailCount = await countAttempt(`auth-limit:${options.scope}:email:${email}`, AUTH_WINDOW_SECONDS);
      if (emailCount > options.maxPerEmail) return rejectAuthAttempt(res);
    }

    return next();
  };
}

export const loginAttemptLimiter = createAuthAttemptLimiter({
  scope: 'login',
  maxPerIp: 30,
  maxPerEmail: 10
});

export const forgotPasswordAttemptLimiter = createAuthAttemptLimiter({
  scope: 'forgot-password',
  maxPerIp: 10,
  maxPerEmail: 5
});

export const resetPasswordAttemptLimiter = createAuthAttemptLimiter({
  scope: 'reset-password',
  maxPerIp: 20,
  maxPerEmail: 8
});
