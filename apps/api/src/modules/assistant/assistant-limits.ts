import type { NextFunction, Request, Response } from 'express';

import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { ErrorCodes } from '../../shared/constants/error-codes';
import { ApiError } from '../../shared/utils/api-error';

export const ASSISTANT_CONTEXT_MESSAGE_LIMIT = 20;

function getOmanDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Muscat',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function secondsUntilOmanMidnight() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Muscat',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  const second = Number(parts.find((part) => part.type === 'second')?.value ?? 0);
  const elapsed = hour * 3600 + minute * 60 + second;
  return Math.max(60, 86400 - elapsed);
}

export function trimAssistantContext<T>(messages: T[], limit = ASSISTANT_CONTEXT_MESSAGE_LIMIT): T[] {
  if (messages.length <= limit) return messages;
  return messages.slice(-limit);
}

export async function assistantDailyLimiter(req: Request, _res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const limit = userId ? env.ASSISTANT_DAILY_LIMIT_AUTH : env.ASSISTANT_DAILY_LIMIT_GUEST;
    const dateKey = getOmanDateKey();
    const key = userId
      ? `assistant-daily:user:${userId}:${dateKey}`
      : `assistant-daily:ip:${ip}:${dateKey}`;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, secondsUntilOmanMidnight());
    }

    if (count > limit) {
      return next(
        new ApiError(429, 'Daily assistant message limit reached', ErrorCodes.ASSISTANT_DAILY_LIMIT_REACHED, {
          limit,
          isAuthenticated: Boolean(userId)
        })
      );
    }

    return next();
  } catch {
    return next();
  }
}
