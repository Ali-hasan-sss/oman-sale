import { notificationQueue } from '../../config/queues';
import { notificationsRepository } from './notifications.repository';
import type { CreateNotificationDto } from './notifications.validation';

export class NotificationsService {
  listForUser(userId: string) {
    return notificationsRepository.listForUser(userId);
  }

  async create(dto: CreateNotificationDto) {
    const notification = await notificationsRepository.create(dto);
    await notificationQueue.add('deliver-in-app-notification', { notificationId: notification.id });
    return notification;
  }

  markRead(id: string, userId: string) {
    return notificationsRepository.markRead(id, userId);
  }
}

export const notificationsService = new NotificationsService();
