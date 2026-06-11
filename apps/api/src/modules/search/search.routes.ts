import { Router } from 'express';

import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { searchController } from './search.controller';
import { searchQuerySchema, searchSuggestionsQuerySchema } from './search.validation';

export const searchRoutes = Router();

searchRoutes.get('/ads', validateRequest({ query: searchQuerySchema }), asyncHandler(searchController.searchAds));
searchRoutes.get(
  '/suggestions',
  validateRequest({ query: searchSuggestionsQuerySchema }),
  asyncHandler(searchController.suggestions)
);
