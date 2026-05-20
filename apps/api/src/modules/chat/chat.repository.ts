import { prisma } from '../../shared/prisma/client';
import type { SendMessageDto } from './chat.validation';

export class ChatRepository {
  private directKey(adId: string, userA: string, userB: string) {
    return [adId, ...[userA, userB].sort()].join(':');
  }

  findConversation(adId: string, userA: string, userB: string) {
    return prisma.conversation.findFirst({
      where: {
        directKey: this.directKey(adId, userA, userB),
        deletedAt: null,
      },
      include: { participants: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
  }

  createConversation(adId: string, userA: string, userB: string) {
    return prisma.conversation.create({
      data: {
        adId,
        directKey: this.directKey(adId, userA, userB),
        participants: {
          create: [{ userId: userA }, { userId: userB }]
        }
      },
      include: {
        ad: { include: { images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } } },
        participants: { include: { user: true } }
      }
    });
  }

  findByIdForUser(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        deletedAt: null,
        participants: { some: { userId, deletedAt: null } }
      },
      include: {
        ad: { include: { images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } } },
        participants: { include: { user: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
  }

  listUserConversations(userId: string, page: number, limit: number) {
    const where = { participants: { some: { userId, deletedAt: null } }, deletedAt: null };
    const skip = (page - 1) * limit;

    return Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          ad: { include: { images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } } },
          participants: { include: { user: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: {
            select: {
              messages: {
                where: { receiverId: userId, isRead: false, deletedAt: null }
              }
            }
          }
        },
        orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit
      }),
      prisma.conversation.count({ where })
    ]).then(([items, total]) => ({ items, total, page, limit }));
  }

  unreadCount(userId: string) {
    return prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
        deletedAt: null,
        conversation: {
          deletedAt: null,
          participants: { some: { userId, deletedAt: null } }
        }
      }
    });
  }

  listMessages(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'asc' }
    });
  }

  isParticipant(conversationId: string, userId: string) {
    return prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, deletedAt: null }
    });
  }

  async createMessage(senderId: string, dto: SendMessageDto) {
    const message = await prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        receiverId: dto.receiverId,
        content: dto.content,
        type: dto.type,
        imageUrl: dto.imageUrl
      }
    });

    await prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { lastMessageAt: message.createdAt }
    });

    return message;
  }

  markRead(conversationId: string, userId: string) {
    const now = new Date();
    return prisma.$transaction([
      prisma.message.updateMany({
        where: { conversationId, receiverId: userId, isRead: false },
        data: { isRead: true, readAt: now }
      }),
      prisma.conversationParticipant.updateMany({
        where: { conversationId, userId },
        data: { lastReadAt: now }
      })
    ]);
  }
}

export const chatRepository = new ChatRepository();
