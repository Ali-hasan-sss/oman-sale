import { create } from 'zustand';

import { api } from '@/lib/api';
import { getRealtimeSocket } from '@/lib/realtime';
import { getUserAccessToken } from '@/lib/user-auth';

type RealtimeMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

type ChatRealtimeState = {
  activeConversationId?: string;
  initialized: boolean;
  onlineUserIds: Set<string>;
  unreadCount: number;
  unreadConversationIds: Set<string>;
  connect: () => void;
  setActiveConversationId: (conversationId?: string) => void;
  setConversationRead: (conversationId: string) => void;
  requestPresence: (userIds: string[]) => void;
};

const playNotificationSound = () => {
  if (typeof window === 'undefined') return;

  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const playTone = (frequency: number, startAt: number, duration: number, volume: number) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  };

  const startAt = context.currentTime;
  playTone(520, startAt, 0.14, 0.035);
  playTone(660, startAt + 0.11, 0.18, 0.03);
  window.setTimeout(() => context.close().catch(() => undefined), 450);
};

export const useChatRealtimeStore = create<ChatRealtimeState>((set, get) => ({
  activeConversationId: undefined,
  initialized: false,
  onlineUserIds: new Set(),
  unreadCount: 0,
  unreadConversationIds: new Set(),

  connect: () => {
    const token = getUserAccessToken();
    if (!token) return;

    api
      .get<{ data: { count: number } }>('/chat/unread-count', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => set({ unreadCount: response.data.data.count }))
      .catch(() => undefined);

    const socket = getRealtimeSocket();
    if (!socket || get().initialized) return;

    socket.on('message:received', (message: RealtimeMessage) => {
      set((state) => {
        if (state.activeConversationId === message.conversationId) return state;

        const unreadConversationIds = new Set(state.unreadConversationIds);
        const isNewConversationUnread = !unreadConversationIds.has(message.conversationId);
        unreadConversationIds.add(message.conversationId);

        return {
          unreadConversationIds,
          unreadCount: state.unreadCount + (isNewConversationUnread ? 1 : 0)
        };
      });

      if (get().activeConversationId !== message.conversationId) {
        playNotificationSound();
      }
    });

    socket.on('presence:changed', ({ userId, online }: { userId: string; online: boolean }) => {
      set((state) => {
        const onlineUserIds = new Set(state.onlineUserIds);
        if (online) onlineUserIds.add(userId);
        else onlineUserIds.delete(userId);
        return { onlineUserIds };
      });
    });

    set({ initialized: true });
  },

  setActiveConversationId: (conversationId) => {
    set({ activeConversationId: conversationId });
    if (conversationId) get().setConversationRead(conversationId);
  },

  setConversationRead: (conversationId) => {
    set((state) => {
      if (!state.unreadConversationIds.has(conversationId)) return state;
      const unreadConversationIds = new Set(state.unreadConversationIds);
      unreadConversationIds.delete(conversationId);
      return {
        unreadConversationIds,
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    });
  },

  requestPresence: (userIds) => {
    const socket = getRealtimeSocket();
    if (!socket || userIds.length === 0) return;

    socket.emit('presence:get', userIds, (statuses: Record<string, boolean>) => {
      set((state) => {
        const onlineUserIds = new Set(state.onlineUserIds);
        Object.entries(statuses).forEach(([userId, online]) => {
          if (online) onlineUserIds.add(userId);
          else onlineUserIds.delete(userId);
        });
        return { onlineUserIds };
      });
    });
  }
}));
