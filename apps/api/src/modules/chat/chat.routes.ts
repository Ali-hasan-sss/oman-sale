import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/utils/async-handler';
import { validateRequest } from '../../shared/validators/validate-request';
import { chatController } from './chat.controller';
import { openConversationSchema, sendMessageSchema } from './chat.validation';

const conversationParams = z.object({ conversationId: z.string().uuid() });

export const chatRoutes = Router();

chatRoutes.use(requireAuth);
chatRoutes.get('/conversations', asyncHandler(chatController.listConversations));
chatRoutes.get('/unread-count', asyncHandler(chatController.unreadCount));
chatRoutes.post(
  '/conversations',
  validateRequest({ body: openConversationSchema }),
  asyncHandler(chatController.openConversation)
);
chatRoutes.get(
  '/conversations/:conversationId',
  validateRequest({ params: conversationParams }),
  asyncHandler(chatController.getConversation)
);
chatRoutes.get(
  '/conversations/:conversationId/messages',
  validateRequest({ params: conversationParams }),
  asyncHandler(chatController.listMessages)
);
chatRoutes.post(
  '/messages',
  validateRequest({ body: sendMessageSchema }),
  asyncHandler(chatController.sendMessage)
);
chatRoutes.post(
  '/conversations/:conversationId/read',
  validateRequest({ params: conversationParams }),
  asyncHandler(chatController.markRead)
);
