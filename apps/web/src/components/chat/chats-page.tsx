'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { SiteFooter } from '@/components/home/site-footer';
import { UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getRealtimeSocket } from '@/lib/realtime';
import { getStoredUser, getUserAccessToken, type UserAuthUser } from '@/lib/user-auth';
import { useChatRealtimeStore } from '@/store/chat-realtime-store';
import { useAuthStore } from '@/store/auth-store';

type ConversationAd = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  area?: string | null;
  images?: Array<{ imageUrl: string }>;
};

type ConversationMessage = {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
};

type Conversation = {
  id: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  ad: ConversationAd;
  participants: Array<{
    userId: string;
    user: UserAuthUser;
  }>;
  messages: ConversationMessage[];
};

type ConversationsResponse = {
  items: Conversation[];
  total: number;
  page: number;
  limit: number;
};

const fallbackImage = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop';

const labels = {
  ar: {
    title: 'دردشاتي',
    subtitle: 'تابع محادثاتك مع البائعين والمشترين',
    search: 'ابحث في المحادثات...',
    loading: 'جاري تحميل المحادثات...',
    empty: 'لا توجد محادثات حتى الآن.',
    newMessage: 'رسالة جديدة',
    noMessages: 'لا توجد رسائل بعد'
  },
  en: {
    title: 'My Chats',
    subtitle: 'Follow your conversations with sellers and buyers',
    search: 'Search conversations...',
    loading: 'Loading conversations...',
    empty: 'No conversations yet.',
    newMessage: 'New message',
    noMessages: 'No messages yet'
  }
};

export function ChatsPage() {
  const router = useRouter();
  const { dir, locale, localizedPath } = useI18n();
  const text = labels[locale];
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const connectRealtime = useChatRealtimeStore((state) => state.connect);
  const onlineUserIds = useChatRealtimeStore((state) => state.onlineUserIds);
  const requestPresence = useChatRealtimeStore((state) => state.requestPresence);
  const unreadConversationIds = useChatRealtimeStore((state) => state.unreadConversationIds);
  const [currentUser, setCurrentUser] = useState<UserAuthUser | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    hydrateFromStorage();
    const token = getUserAccessToken();
    const storedUser = getStoredUser();
    setCurrentUser(storedUser);

    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    api
      .get<{ data: ConversationsResponse }>('/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 50 }
      })
      .then((response) => {
        const items = response.data.data?.items;
        setConversations(Array.isArray(items) ? items : []);
      })
      .catch(() => setConversations([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (conversations.length === 0) return;
    const otherUserIds = conversations
      .map((conversation) => getOtherUser(conversation, currentUser?.id)?.id)
      .filter(Boolean) as string[];
    requestPresence(otherUserIds);
  }, [conversations, currentUser?.id, requestPresence]);

  useEffect(() => {
    connectRealtime();
    const socket = getRealtimeSocket();
    if (!socket) return;

    const receiveMessage = (message: ConversationMessage) => {
      setConversations((current) => {
        const conversation = current.find((item) => item.id === message.conversationId);
        if (!conversation) return current;

        const updatedConversation = {
          ...conversation,
          lastMessageAt: message.createdAt,
          messages: [message]
        };

        return [updatedConversation, ...current.filter((item) => item.id !== message.conversationId)];
      });
    };

    socket.on('message:received', receiveMessage);
    socket.on('message:sent', receiveMessage);

    return () => {
      socket.off('message:received', receiveMessage);
      socket.off('message:sent', receiveMessage);
    };
  }, [connectRealtime]);

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((conversation) => {
      const otherUser = getOtherUser(conversation, currentUser?.id);
      const lastMessage = conversation.messages[0]?.content ?? '';
      return [conversation.ad.title, otherUser?.fullName, lastMessage]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [conversations, currentUser?.id, search]);

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader />

      <main className="site-container site-page-main site-page-main--compact min-w-0" dir={dir}>
        <div className="mb-5 sm:mb-6">
          <h1 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">{text.title}</h1>
          <p className="text-sm text-gray-600 sm:text-base">{text.subtitle}</p>
        </div>

        <div className="-mx-3 overflow-hidden rounded-none bg-white shadow-sm sm:mx-0 sm:rounded-xl">
          <div className="border-b border-gray-200 p-3 sm:p-4">
            <div className="relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="text"
                placeholder={text.search}
                className={`w-full rounded-lg border border-gray-300 py-3 outline-none focus:ring-2 focus:ring-green-500 ${dir === 'rtl' ? 'pl-4 pr-12' : 'pl-12 pr-4'}`}
              />
            </div>
          </div>

          {isLoading ? (
            <ChatConversationsSkeleton />
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-sm font-bold text-gray-500 sm:p-8">{text.empty}</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  currentUserId={currentUser?.id}
                  isOtherUserOnline={Boolean(getOtherUser(conversation, currentUser?.id)?.id && onlineUserIds.has(getOtherUser(conversation, currentUser?.id)!.id))}
                  isRealtimeUnread={unreadConversationIds.has(conversation.id)}
                  newMessageLabel={text.newMessage}
                  noMessagesLabel={text.noMessages}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ChatConversationsSkeleton() {
  return (
    <div className="divide-y divide-gray-200">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 p-3 sm:gap-4 sm:p-4">
          <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-lg bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-2 w-2 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="h-3 w-48 animate-pulse rounded-full bg-slate-200" />
              </div>
              <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationRow({
  conversation,
  currentUserId,
  isOtherUserOnline,
  isRealtimeUnread,
  newMessageLabel,
  noMessagesLabel
}: {
  conversation: Conversation;
  currentUserId?: string;
  isOtherUserOnline: boolean;
  isRealtimeUnread: boolean;
  newMessageLabel: string;
  noMessagesLabel: string;
}) {
  const { localizedPath } = useI18n();
  const otherUser = getOtherUser(conversation, currentUserId);
  const lastMessage = conversation.messages[0];
  const hasUnread = isRealtimeUnread || Boolean(lastMessage && lastMessage.receiverId === currentUserId && !lastMessage.isRead);
  const image = conversation.ad.images?.[0]?.imageUrl ?? fallbackImage;

  return (
    <Link className="flex items-start gap-3 p-3 transition hover:bg-gray-50 sm:gap-4 sm:p-4" href={localizedPath(`/chat/${conversation.id}`)}>
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
        <img src={image} alt={conversation.ad.title} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate font-bold text-gray-900">{otherUser?.fullName ?? '-'}</h3>
              <span className={`h-2 w-2 rounded-full ${isOtherUserOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <p className="truncate text-sm text-gray-600">{conversation.ad.title}</p>
          </div>
          <span className="whitespace-nowrap text-xs text-gray-500">{formatRelativeTime(lastMessage?.createdAt ?? conversation.lastMessageAt ?? conversation.updatedAt)}</span>
        </div>
        <p className={`truncate text-sm ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
          {lastMessage?.content ?? noMessagesLabel}
        </p>
        {hasUnread ? (
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-600" />
            <span className="text-xs font-medium text-green-600">{newMessageLabel}</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function getOtherUser(conversation: Conversation, currentUserId?: string) {
  return conversation.participants.find((participant) => participant.userId !== currentUserId)?.user;
}

function formatRelativeTime(value?: string | null) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'الآن';
  if (diff < hour) return `منذ ${Math.floor(diff / minute)} دقائق`;
  if (diff < day) return `منذ ${Math.floor(diff / hour)} ساعات`;
  if (diff < 2 * day) return 'أمس';
  return new Date(value).toISOString().slice(0, 10);
}
