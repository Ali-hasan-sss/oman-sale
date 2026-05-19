import type { RequestHandler } from 'express';

import { ApiError } from '../utils/api-error';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
