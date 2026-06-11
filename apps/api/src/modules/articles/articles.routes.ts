import { Router } from 'express';
import { z } from 'zod';

import { optionalAuth, requireAuth } from '../../shared/middleware/auth';
import { ensureActiveUser } from '../../shared/middleware/ensure-active-user';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { articlesController } from './articles.controller';
import {
  createCommentSchema,
  updateCommentSchema,
  idOrSlugParams,
  idParams,
  latestArticlesQuerySchema,
  listArticlesQuerySchema,
  listCommentsQuerySchema,
  reactionSchema
} from './articles.validation';

const commentIdParams = z.object({
  id: z.string().uuid(),
  commentId: z.string().uuid()
});

export const articlesRoutes = Router();

articlesRoutes.get('/categories', asyncHandler(articlesController.listCategories));
articlesRoutes.get(
  '/',
  validateRequest({ query: listArticlesQuerySchema }),
  asyncHandler(articlesController.list)
);
articlesRoutes.get(
  '/latest',
  validateRequest({ query: latestArticlesQuerySchema }),
  asyncHandler(articlesController.latest)
);
articlesRoutes.get('/saves', requireAuth, ensureActiveUser, asyncHandler(articlesController.saves));
articlesRoutes.get('/saves/ids', requireAuth, ensureActiveUser, asyncHandler(articlesController.saveIds));
articlesRoutes.get(
  '/:idOrSlug',
  optionalAuth,
  validateRequest({ params: idOrSlugParams }),
  asyncHandler(articlesController.get)
);
articlesRoutes.get(
  '/:id/comments',
  validateRequest({ params: idParams, query: listCommentsQuerySchema }),
  asyncHandler(articlesController.listComments)
);
articlesRoutes.post(
  '/:id/comments',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams, body: createCommentSchema }),
  asyncHandler(articlesController.createComment)
);
articlesRoutes.patch(
  '/:id/comments/:commentId',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: commentIdParams, body: updateCommentSchema }),
  asyncHandler(articlesController.updateComment)
);
articlesRoutes.delete(
  '/:id/comments/:commentId',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: commentIdParams }),
  asyncHandler(articlesController.deleteComment)
);
articlesRoutes.get(
  '/:id/reactions',
  optionalAuth,
  validateRequest({ params: idParams }),
  asyncHandler(articlesController.getReactions)
);
articlesRoutes.post(
  '/:id/reactions',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams, body: reactionSchema }),
  asyncHandler(articlesController.setReaction)
);
articlesRoutes.delete(
  '/:id/reactions',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(articlesController.removeReaction)
);
articlesRoutes.post(
  '/:id/save',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(articlesController.save)
);
articlesRoutes.delete(
  '/:id/save',
  requireAuth,
  ensureActiveUser,
  validateRequest({ params: idParams }),
  asyncHandler(articlesController.unsave)
);
