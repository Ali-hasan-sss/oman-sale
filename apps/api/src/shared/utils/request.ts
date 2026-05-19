import type { Request } from 'express';

import { ApiError } from './api-error';

export const getRequiredParam = (req: Request, key: string): string => {
  const value = req.params[key];
  if (!value) throw new ApiError(400, `Missing route parameter: ${key}`);
  return value;
};
