import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

export async function fetchNotifications() {
  const response = await http.get<ApiEnvelope<AppNotification[]>>(API_ENDPOINTS.notifications.list);
  return Array.isArray(response.data.data) ? response.data.data : [];
}

export async function fetchNotificationUnreadCount() {
  const response = await http.get<ApiEnvelope<{ count: number }>>(API_ENDPOINTS.notifications.unreadCount);
  return response.data.data.count;
}

export async function markNotificationRead(id: string) {
  await http.post(API_ENDPOINTS.notifications.read(id));
}

export async function markAllNotificationsRead() {
  await http.post(API_ENDPOINTS.notifications.readAll);
}

export async function registerPushToken(token: string, platform: 'ANDROID' | 'IOS') {
  await http.post(API_ENDPOINTS.notifications.pushToken, { token, platform });
}

export async function removePushToken(token: string) {
  await http.delete(API_ENDPOINTS.notifications.pushToken, { data: { token } });
}
