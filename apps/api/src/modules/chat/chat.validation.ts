import { MessageType } from '@prisma/client';
import { z } from 'zod';

export const openConversationSchema = z.object({
  adId: z.string().uuid(),
  receiverId: z.string().uuid()
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  receiverId: z.string().uuid(),
  content: z.string().min(1),
  type: z.nativeEnum(MessageType).default(MessageType.TEXT),
  imageUrl: z.string().url().optional()
});

export type OpenConversationDto = z.infer<typeof openConversationSchema>;
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
