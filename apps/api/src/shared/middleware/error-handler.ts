import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { env } from '../../config/env';
import { ApiError } from '../utils/api-error';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (env.NODE_ENV === 'development') {
    console.error(error);
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message
    });
  }

  if (error instanceof ZodError) {
    return res.status(422).json({ message: 'Validation failed' });
  }

  return res.status(500).json({ message: 'Internal server error' });
};
