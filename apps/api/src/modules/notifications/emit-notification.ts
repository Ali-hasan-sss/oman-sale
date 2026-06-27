import { getSocketServer } from '../../config/socket';
import { prisma } from '../../shared/prisma/client';

export async function emitInAppNotification(notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, deletedAt: null }
  });
  if (!notification) return;

  getSocketServer()?.to(`user:${notification.userId}`).emit('notification:new', {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    metadata: notification.metadata,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString()
  });
}
