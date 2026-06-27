import { Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import type { CreateNotificationDto } from './notifications.validation';

export class NotificationsRepository {
  listForUser(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  unreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, deletedAt: null, isRead: false }
    });
  }

  create(data: CreateNotificationDto) {
    const { metadata, ...rest } = data;
    return prisma.notification.create({
      data: {
        ...rest,
        ...(metadata !== undefined && { metadata: metadata as Prisma.InputJsonValue })
      }
    });
  }

  markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() }
    });
  }

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true, readAt: new Date() }
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
