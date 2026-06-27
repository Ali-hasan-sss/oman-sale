import { create } from 'zustand';

import { getRealtimeSocket } from '../lib/realtime/socket';
import {
  fetchNotificationUnreadCount,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification
} from '../services/notifications.service';
import { useAuthStore } from './auth-store';

type NotificationsState = {
  initialized: boolean;
  unreadCount: number;
  items: AppNotification[];
  connect: () => void;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  initialized: false,
  unreadCount: 0,
  items: [],

  connect: () => {
    if (get().initialized || !useAuthStore.getState().accessToken) return;

    const socket = getRealtimeSocket();
    if (!socket) return;

    const onNew = (notification: AppNotification) => {
      set((state) => ({
        unreadCount: state.unreadCount + 1,
        items: [notification, ...state.items].slice(0, 50)
      }));
    };

    socket.on('notification:new', onNew);
    set({ initialized: true });
    void get().refresh();
  },

  refresh: async () => {
    if (!useAuthStore.getState().accessToken) return;

    const [items, unreadCount] = await Promise.all([fetchNotifications(), fetchNotificationUnreadCount()]);
    set({ items, unreadCount });
  },

  markRead: async (id: string) => {
    await markNotificationRead(id);
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - (state.items.find((item) => item.id === id && !item.isRead) ? 1 : 0)),
      items: state.items.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    }));
  },

  markAllRead: async () => {
    await markAllNotificationsRead();
    set((state) => ({
      unreadCount: 0,
      items: state.items.map((item) => ({ ...item, isRead: true }))
    }));
  }
}));

export function connectNotificationsRealtime() {
  useNotificationsStore.getState().connect();
}
