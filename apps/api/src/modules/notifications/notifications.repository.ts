import { prisma } from '../../shared/prisma/client';
import type { CreateNotificationDto } from './notifications.validation';

export class NotificationsRepository {
  listForUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  }

  create(data: CreateNotificationDto) {
    return prisma.notification.create({ data });
  }

  markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() }
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
