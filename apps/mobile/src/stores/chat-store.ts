import { create } from 'zustand';

import { playChatNotificationSound, unloadChatNotificationSound } from '../lib/chat-notification-sound';
import { disconnectRealtimeSocket, getRealtimeSocket } from '../lib/realtime/socket';
import { fetchUnreadCount, markConversationReadRequest } from '../services/chat.service';
import type { ChatMessage } from '../types';
import { useAuthStore } from './auth-store';

type TypingState = {
  conversationId: string;
  userId: string;
};

type ChatRealtimeState = {
  activeConversationId: string | null;
  initialized: boolean;
  onlineUserIds: Record<string, boolean>;
  typing: TypingState | null;
  unreadCount: number;
  unreadConversationIds: string[];
  unreadByConversation: Record<string, number>;
  listRefreshToken: number;
  connect: () => void;
  disconnect: () => void;
  setActiveConversationId: (conversationId: string | null) => void;
  setConversationRead: (conversationId: string) => void;
  refreshUnreadCount: () => Promise<void>;
  syncUnreadFromConversations: (
    conversations: Array<{ id: string; unreadCount?: number; messages: ChatMessage[] }>,
    userId: string
  ) => void;
  getConversationUnreadCount: (conversationId: string) => number;
  requestPresence: (userIds: string[]) => void;
  isUserOnline: (userId: string) => boolean;
  isOtherTypingIn: (conversationId: string, otherUserId: string) => boolean;
  emitTypingStarted: (conversationId: string) => void;
  emitTypingStopped: (conversationId: string) => void;
  onIncomingMessage: (message: ChatMessage) => void;
};

function buildUnreadLists(unreadByConversation: Record<string, number>) {
  const unreadConversationIds = Object.entries(unreadByConversation)
    .filter(([, count]) => count > 0)
    .map(([id]) => id);
  const unreadCount = Object.values(unreadByConversation).reduce((sum, count) => sum + count, 0);
  return { unreadConversationIds, unreadCount };
}

export const useChatStore = create<ChatRealtimeState>((set, get) => ({
  activeConversationId: null,
  initialized: false,
  onlineUserIds: {},
  typing: null,
  unreadCount: 0,
  unreadConversationIds: [],
  unreadByConversation: {},
  listRefreshToken: 0,

  connect: () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    get().refreshUnreadCount().catch(() => undefined);

    const socket = getRealtimeSocket();
    if (!socket) return;

    if (get().initialized) {
      get().refreshUnreadCount().catch(() => undefined);
      return;
    }

    socket.off('message:received');
    socket.off('message:sent');
    socket.off('messages:read');
    socket.off('typing:started');
    socket.off('typing:stopped');
    socket.off('presence:changed');

    socket.on('message:received', (message: ChatMessage) => {
      get().onIncomingMessage(message);
    });

    socket.on('message:sent', (message: ChatMessage) => {
      if (get().activeConversationId === message.conversationId) {
        get().onIncomingMessage(message);
      }
    });

    socket.on('messages:read', ({ conversationId, readerId }: { conversationId: string; readerId: string }) => {
      const currentUserId = useAuthStore.getState().user?.id;
      if (!currentUserId || readerId === currentUserId) return;
      if (get().activeConversationId === conversationId) return;
      set((state) => ({
        listRefreshToken: state.listRefreshToken + 1
      }));
    });

    socket.on('typing:started', ({ conversationId, userId }: TypingState) => {
      const currentUserId = useAuthStore.getState().user?.id;
      if (userId === currentUserId) return;
      set({ typing: { conversationId, userId } });
    });

    socket.on('typing:stopped', ({ conversationId, userId }: TypingState) => {
      const current = get().typing;
      if (current?.conversationId === conversationId && current.userId === userId) {
        set({ typing: null });
      }
    });

    socket.on('presence:changed', ({ userId, online }: { userId: string; online: boolean }) => {
      set((state) => ({
        onlineUserIds: {
          ...state.onlineUserIds,
          [userId]: online
        }
      }));
    });

    set({ initialized: true });
  },

  disconnect: () => {
    unloadChatNotificationSound().catch(() => undefined);
    disconnectRealtimeSocket();
    set({
      activeConversationId: null,
      initialized: false,
      onlineUserIds: {},
      typing: null,
      unreadCount: 0,
      unreadConversationIds: [],
      unreadByConversation: {},
      listRefreshToken: 0
    });
  },

  setActiveConversationId: (conversationId) => {
    const previous = get().activeConversationId;
    const socket = getRealtimeSocket();

    if (previous && socket) {
      socket.emit('conversation:leave', previous);
    }

    set({ activeConversationId: conversationId });

    if (conversationId) {
      socket?.emit('conversation:join', conversationId);
      get().setConversationRead(conversationId);
    }
  },

  setConversationRead: (conversationId) => {
    markConversationReadRequest(conversationId).catch(() => undefined);

    set((state) => {
      if (!state.unreadByConversation[conversationId]) return state;
      const unreadByConversation = { ...state.unreadByConversation };
      delete unreadByConversation[conversationId];
      const lists = buildUnreadLists(unreadByConversation);
      return { unreadByConversation, ...lists };
    });

    get().refreshUnreadCount().catch(() => undefined);
  },

  refreshUnreadCount: async () => {
    try {
      const count = await fetchUnreadCount();
      set({ unreadCount: count });
    } catch {
      /* ignore */
    }
  },

  syncUnreadFromConversations: (conversations, userId) => {
    const unreadByConversation = { ...get().unreadByConversation };

    conversations.forEach((conversation) => {
      const fromApi =
        typeof conversation.unreadCount === 'number'
          ? conversation.unreadCount
          : conversation.messages[0]?.receiverId === userId && !conversation.messages[0]?.isRead
            ? 1
            : 0;
      const existing = unreadByConversation[conversation.id] ?? 0;
      const count = Math.max(existing, fromApi);

      if (count > 0) {
        unreadByConversation[conversation.id] = count;
      } else {
        delete unreadByConversation[conversation.id];
      }
    });

    const lists = buildUnreadLists(unreadByConversation);
    set({ unreadByConversation, ...lists });
  },

  getConversationUnreadCount: (conversationId) => get().unreadByConversation[conversationId] ?? 0,

  requestPresence: (userIds) => {
    const socket = getRealtimeSocket();
    if (!socket || userIds.length === 0) return;

    socket.emit('presence:get', userIds, (statuses: Record<string, boolean>) => {
      set((state) => {
        const onlineUserIds = { ...state.onlineUserIds };
        Object.entries(statuses).forEach(([userId, online]) => {
          onlineUserIds[userId] = online;
        });
        return { onlineUserIds };
      });
    });
  },

  isUserOnline: (userId) => Boolean(get().onlineUserIds[userId]),

  isOtherTypingIn: (conversationId, otherUserId) => {
    const typing = get().typing;
    return typing?.conversationId === conversationId && typing.userId === otherUserId;
  },

  emitTypingStarted: (conversationId) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    getRealtimeSocket()?.emit('typing:started', { conversationId, userId });
  },

  emitTypingStopped: (conversationId) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    getRealtimeSocket()?.emit('typing:stopped', { conversationId, userId });
  },

  onIncomingMessage: (message) => {
    const currentUserId = useAuthStore.getState().user?.id;
    const isActiveThread = get().activeConversationId === message.conversationId;
    const isIncoming = message.receiverId === currentUserId;

    set((state) => ({
      listRefreshToken: state.listRefreshToken + 1
    }));

    if (isActiveThread) {
      if (isIncoming) {
        get().setConversationRead(message.conversationId);
      }
      return;
    }

    if (!isIncoming) return;

    set((state) => {
      const unreadByConversation = {
        ...state.unreadByConversation,
        [message.conversationId]: (state.unreadByConversation[message.conversationId] ?? 0) + 1
      };
      const lists = buildUnreadLists(unreadByConversation);
      return { unreadByConversation, ...lists };
    });

    playChatNotificationSound().catch(() => undefined);
    get().refreshUnreadCount().catch(() => undefined);
  }
}));

export function disconnectChatRealtime() {
  useChatStore.getState().disconnect();
}

export function connectChatRealtime() {
  useChatStore.getState().connect();
}
