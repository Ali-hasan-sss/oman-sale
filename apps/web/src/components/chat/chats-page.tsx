'use client';

import { Globe, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
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
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
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
      .get<{ data: Conversation[] }>('/chat/conversations', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setConversations(response.data.data))
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
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link className="flex items-center gap-3" href={localizedPath('/')}>
              <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
            </Link>
            <MobileNavMenu />
            <div className="hidden items-center gap-4 lg:flex">
              <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition hover:bg-gray-50" onClick={toggleLocale} type="button">
                <Globe size={18} />
                <span className="text-sm">{m.common.languageSwitch}</span>
              </button>
              <ChatNavLink className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
              <HeaderLink href="/all-listings" label={m.common.allListings} />
              <HeaderLink href="/my-listings" label={m.common.myListings} />
              <Link className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700" href={localizedPath('/add-listing')}>
                {m.common.addListing}
              </Link>
              <HeaderAuthAction loginClassName="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8" dir={dir}>
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{text.title}</h1>
          <p className="text-gray-600">{text.subtitle}</p>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
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
            <div className="p-8 text-center font-bold text-gray-500">{text.empty}</div>
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

  function HeaderLink({ href, label }: { href: string; label: string }) {
    return (
      <Link className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" href={localizedPath(href)}>
        {label}
      </Link>
    );
  }
}

function ChatConversationsSkeleton() {
  return (
    <div className="divide-y divide-gray-200">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-start gap-4 p-4">
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
    <Link className="flex items-start gap-4 p-4 transition hover:bg-gray-50" href={localizedPath(`/chat/${conversation.id}`)}>
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
