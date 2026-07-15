import { Router } from 'express';

import { asyncHandler } from '../../shared/utils/async-handler';
import { rafflesController } from './raffles.controller';

export const rafflesRoutes = Router();

rafflesRoutes.get('/active', asyncHandler(rafflesController.getActivePublic));
