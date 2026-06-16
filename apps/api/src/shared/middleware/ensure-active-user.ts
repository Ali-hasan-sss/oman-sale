import type { RequestHandler } from 'express';

import { prisma } from '../prisma/client';
import { ErrorCodes } from '../constants/error-codes';
import { ApiError } from '../utils/api-error';

type EnsureActiveUserOptions = {
  allowIncompleteProfile?: boolean;
};

function createEnsureActiveUser(options?: EnsureActiveUserOptions): RequestHandler {
  return async (req, _res, next) => {
    if (!req.user) return next();

    const user = await prisma.user.findFirst({
      where: { id: req.user.id, deletedAt: null },
      select: { isActive: true, isBlocked: true, profileCompleted: true }
    });

    if (!user) {
      return next(new ApiError(403, 'Account is not allowed', ErrorCodes.ACCOUNT_INACTIVE));
    }

    if (user.isBlocked) {
      return next(new ApiError(403, 'Account is not allowed', ErrorCodes.ACCOUNT_BLOCKED));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Account is not allowed', ErrorCodes.ACCOUNT_INACTIVE));
    }

    if (!options?.allowIncompleteProfile && !user.profileCompleted) {
      return next(new ApiError(403, 'Profile completion required', ErrorCodes.PROFILE_INCOMPLETE));
    }

    return next();
  };
}

export const ensureActiveUser = createEnsureActiveUser();
export const ensureActiveUserAllowIncomplete = createEnsureActiveUser({ allowIncompleteProfile: true });
