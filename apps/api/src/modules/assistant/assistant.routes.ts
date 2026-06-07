import { Router } from 'express';

import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { optionalAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { assistantController } from './assistant.controller';
import { assistantDailyLimiter } from './assistant-limits';
import { assistantChatSchema } from './assistant.validation';
import { assistantQuickReplySchema } from './assistant-canned.validation';

const assistantRateLimiter = async (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const windowSeconds = 60;
  const max = env.ASSISTANT_RATE_LIMIT_MAX;
  const key = `assistant-rate:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  if (count > max) {
    return res.status(429).json({ message: 'Too many assistant requests' });
  }
  return next();
};

export const assistantRoutes = Router();

assistantRoutes.post(
  '/quick-reply',
  optionalAuth,
  validateRequest({ body: assistantQuickReplySchema }),
  asyncHandler(assistantController.quickReply.bind(assistantController))
);

assistantRoutes.post(
  '/chat',
  optionalAuth,
  assistantDailyLimiter,
  assistantRateLimiter,
  validateRequest({ body: assistantChatSchema }),
  asyncHandler(assistantController.chat.bind(assistantController))
);
