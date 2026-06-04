import { Router } from 'express';

import { asyncHandler } from '../../shared/utils/async-handler';
import { storeTypesController } from './store-types.controller';

export const storeTypesRoutes = Router();

storeTypesRoutes.get('/', asyncHandler(storeTypesController.listPublic));
