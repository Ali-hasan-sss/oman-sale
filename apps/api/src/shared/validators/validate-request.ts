import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

import { ApiError } from '../utils/api-error';

type RequestSchemas = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
};

export const validateRequest =
  (schemas: RequestSchemas) => (req: Request, _res: Response, next: NextFunction) => {
    const body = schemas.body?.safeParse(req.body);
    if (body && !body.success) return next(new ApiError(422, 'Invalid request body', body.error));
    if (body) req.body = body.data as typeof req.body;

    const params = schemas.params?.safeParse(req.params);
    if (params && !params.success) return next(new ApiError(422, 'Invalid route params', params.error));
    if (params) req.params = params.data as typeof req.params;

    const query = schemas.query?.safeParse(req.query);
    if (query && !query.success) return next(new ApiError(422, 'Invalid query params', query.error));
    if (query) req.query = query.data as typeof req.query;

    return next();
  };
