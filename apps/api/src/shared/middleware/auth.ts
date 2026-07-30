import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';

import { env } from '../../config/env';
import { ErrorCodes } from '../constants/error-codes';
import { prisma } from '../prisma/client';
import { ApiError } from '../utils/api-error';
import type { AccessTokenPayload } from '../utils/tokens';

async function resolveAuthUser(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  const user = await prisma.user.findFirst({
    where: { id: payload.sub, deletedAt: null },
    select: { tokenVersion: true }
  });

  if (!user || user.tokenVersion !== (payload.tokenVersion ?? -1)) {
    throw new ApiError(401, 'Session expired', ErrorCodes.SESSION_EXPIRED);
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role as UserRole
  };
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return next(new ApiError(401, 'Authentication required'));

  try {
    req.user = await resolveAuthUser(token);
    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return next();

  try {
    req.user = await resolveAuthUser(token);
  } catch {
    // Ignore invalid tokens for public endpoints that only use identity for view deduplication.
  }

  return next();
};

export const authorize =
  (...roles: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Insufficient permissions'));
    return next();
  };
