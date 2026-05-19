import { Router } from 'express';

import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { searchController } from './search.controller';
import { searchQuerySchema } from './search.validation';

export const searchRoutes = Router();

searchRoutes.get('/ads', validateRequest({ query: searchQuerySchema }), asyncHandler(searchController.searchAds));
