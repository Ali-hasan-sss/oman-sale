'use client';

import { create } from 'zustand';

import { getNotificationAccessToken, getNotificationApiClient } from '@/lib/notification-session';
import { disconnectNotificationRealtimeSocket, getNotificationRealtimeSocket } from '@/lib/realtime';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationRealtimeState = {
  initialized: boolean;
  unreadCount: number;
  items: AppNotification[];
  connect: () => void;
  reset: () => void;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

export const useNotificationRealtimeStore = create<NotificationRealtimeState>((set, get) => ({
  initialized: false,
  unreadCount: 0,
  items: [],

  reset: () => {
    disconnectNotificationRealtimeSocket();
    set({ initialized: false, unreadCount: 0, items: [] });
  },

  connect: () => {
    if (!getNotificationAccessToken()) {
      get().reset();
      return;
    }

    const socket = getNotificationRealtimeSocket();
    if (!socket) return;

    if (!get().initialized) {
      const onNew = (notification: AppNotification) => {
        set((state) => ({
          unreadCount: state.unreadCount + 1,
          items: [notification, ...state.items].slice(0, 50)
        }));
      };

      socket.on('notification:new', onNew);
      set({ initialized: true });
    }

    void get().refresh();
  },

  refresh: async () => {
    const client = getNotificationApiClient();
    if (!client) {
      get().reset();
      return;
    }

    const [listRes, countRes] = await Promise.all([
      client.get<{ data: AppNotification[] }>('/notifications'),
      client.get<{ data: { count: number } }>('/notifications/unread-count')
    ]);

    set({
      items: listRes.data.data,
      unreadCount: countRes.data.data.count
    });
  },

  markRead: async (id: string) => {
    const client = getNotificationApiClient();
    if (!client) return;

    await client.post(`/notifications/${id}/read`);
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - (state.items.find((item) => item.id === id && !item.isRead) ? 1 : 0)),
      items: state.items.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    }));
  },

  markAllRead: async () => {
    const client = getNotificationApiClient();
    if (!client) return;

    await client.post('/notifications/read-all');
    set((state) => ({
      unreadCount: 0,
      items: state.items.map((item) => ({ ...item, isRead: true }))
    }));
  }
}));
