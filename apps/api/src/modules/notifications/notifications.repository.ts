import { Prisma } from '@prisma/client';

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
}

export const notificationsRepository = new NotificationsRepository();
