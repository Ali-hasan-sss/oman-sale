import { Prisma } from '@prisma/client';

import { AppEvents } from '../../shared/constants/events';
import { ApiError } from '../../shared/utils/api-error';
import { eventBus } from '../../shared/utils/event-bus';
import { getSocketServer } from '../../config/socket';
import { chatRepository } from './chat.repository';
import type { OpenConversationDto, SendMessageDto } from './chat.validation';

export class ChatService {
  async openConversation(senderId: string, dto: OpenConversationDto) {
    if (senderId === dto.receiverId) throw new ApiError(400, 'Cannot chat with yourself');

    const existing = await chatRepository.findConversation(dto.adId, senderId, dto.receiverId);
    if (existing) return existing;

    try {
      return await chatRepository.createConversation(dto.adId, senderId, dto.receiverId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const conversation = await chatRepository.findConversation(dto.adId, senderId, dto.receiverId);
        if (conversation) return conversation;
      }

      throw error;
    }
  }

  listConversations(userId: string) {
    return chatRepository.listUserConversations(userId);
  }

  unreadCount(userId: string) {
    return chatRepository.unreadCount(userId);
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await chatRepository.findByIdForUser(conversationId, userId);
    if (!conversation) throw new ApiError(404, 'Conversation not found');
    return conversation;
  }

  async listMessages(conversationId: string, userId: string) {
    const participant = await chatRepository.isParticipant(conversationId, userId);
    if (!participant) throw new ApiError(404, 'Conversation not found');
    return chatRepository.listMessages(conversationId);
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    if (senderId === dto.receiverId) throw new ApiError(400, 'Cannot send message to yourself');
    const senderParticipant = await chatRepository.isParticipant(dto.conversationId, senderId);
    const receiverParticipant = await chatRepository.isParticipant(dto.conversationId, dto.receiverId);
    if (!senderParticipant || !receiverParticipant) throw new ApiError(403, 'Invalid conversation participant');

    const message = await chatRepository.createMessage(senderId, dto);
    eventBus.emit(AppEvents.MESSAGE_SENT, message);
    getSocketServer()?.to(`conversation:${dto.conversationId}`).to(`user:${dto.receiverId}`).emit('message:received', message);
    getSocketServer()?.to(`user:${senderId}`).emit('message:sent', message);
    return message;
  }

  async markRead(conversationId: string, userId: string) {
    const result = await chatRepository.markRead(conversationId, userId);
    getSocketServer()?.to(`conversation:${conversationId}`).emit('messages:read', {
      conversationId,
      readerId: userId,
      readAt: new Date().toISOString()
    });
    return result;
  }
}

export const chatService = new ChatService();
