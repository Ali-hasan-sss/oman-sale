'use client';

import { ArrowRight, Check, CheckCheck, EllipsisVertical, Globe, Image, Phone, Send, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

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

type ChatAd = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  area?: string | null;
  images?: Array<{ imageUrl: string }>;
};

type Conversation = {
  id: string;
  ad: ChatAd;
  participants: Array<{
    userId: string;
    user: UserAuthUser;
  }>;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
};

const fallbackImage = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop';

const labels = {
  ar: {
    online: 'متصل',
    offline: 'غير متصل',
    aboutAd: 'حول الإعلان',
    placeholder: 'اكتب رسالة...',
    loading: 'جاري تحميل المحادثة...',
    error: 'تعذر تحميل المحادثة.',
    sendError: 'تعذر إرسال الرسالة.',
    noMessages: 'ابدأ المحادثة برسالة قصيرة.',
    typing: 'يكتب...'
  },
  en: {
    online: 'Online',
    offline: 'Offline',
    aboutAd: 'About listing',
    placeholder: 'Write a message...',
    loading: 'Loading conversation...',
    error: 'Could not load conversation.',
    sendError: 'Could not send message.',
    noMessages: 'Start the conversation with a short message.',
    typing: 'typing...'
  }
};

export function ChatConversationPage({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
  const text = labels[locale];
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const onlineUserIds = useChatRealtimeStore((state) => state.onlineUserIds);
  const requestPresence = useChatRealtimeStore((state) => state.requestPresence);
  const setActiveConversationId = useChatRealtimeStore((state) => state.setActiveConversationId);
  const setConversationRead = useChatRealtimeStore((state) => state.setConversationRead);
  const connectRealtime = useChatRealtimeStore((state) => state.connect);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<UserAuthUser | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | undefined>();
  const isSendingRef = useRef(false);

  const otherUser = conversation?.participants.find((participant) => participant.userId !== currentUser?.id)?.user;
  const isOtherUserOnline = otherUser ? onlineUserIds.has(otherUser.id) : false;
  const appendMessage = (nextMessage: ChatMessage) => {
    setMessages((current) => {
      if (current.some((messageItem) => messageItem.id === nextMessage.id)) return current;
      return [...current, nextMessage];
    });
  };

  useEffect(() => {
    hydrateFromStorage();
    const token = getUserAccessToken();
    const storedUser = getStoredUser();
    setCurrentUser(storedUser);

    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    Promise.all([
      api.get<{ data: Conversation }>(`/chat/conversations/${conversationId}`, { headers: { Authorization: `Bearer ${token}` } }),
      api.get<{ data: ChatMessage[] }>(`/chat/conversations/${conversationId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(([conversationResponse, messagesResponse]) => {
        setConversation(conversationResponse.data.data);
        setMessages(messagesResponse.data.data);
        setConversationRead(conversationId);
        api.post(`/chat/conversations/${conversationId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
      })
      .catch(() => setError(text.error))
      .finally(() => setIsLoading(false));
  }, [conversationId]);

  useEffect(() => {
    connectRealtime();
    setActiveConversationId(conversationId);
    const socket = getRealtimeSocket();
    if (!socket) return () => setActiveConversationId(undefined);

    socket.emit('conversation:join', conversationId);

    const receiveMessage = (nextMessage: ChatMessage) => {
      if (nextMessage.conversationId !== conversationId) return;
      appendMessage(nextMessage);
      setConversationRead(conversationId);
      const token = getUserAccessToken();
      if (token) {
        api.post(`/chat/conversations/${conversationId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
      }
    };
    const markMessagesRead = ({ conversationId: readConversationId, readerId, readAt }: { conversationId: string; readerId: string; readAt: string }) => {
      if (readConversationId !== conversationId || readerId !== otherUser?.id) return;
      setMessages((current) =>
        current.map((messageItem) =>
          messageItem.senderId === currentUser?.id ? { ...messageItem, isRead: true, readAt } : messageItem
        )
      );
    };
    const handleTypingStarted = ({ conversationId: typingConversationId, userId }: { conversationId: string; userId: string }) => {
      if (typingConversationId === conversationId && userId === otherUser?.id) setIsOtherTyping(true);
    };
    const handleTypingStopped = ({ conversationId: typingConversationId, userId }: { conversationId: string; userId: string }) => {
      if (typingConversationId === conversationId && userId === otherUser?.id) setIsOtherTyping(false);
    };

    socket.on('message:received', receiveMessage);
    socket.on('messages:read', markMessagesRead);
    socket.on('typing:started', handleTypingStarted);
    socket.on('typing:stopped', handleTypingStopped);

    return () => {
      socket.off('message:received', receiveMessage);
      socket.off('messages:read', markMessagesRead);
      socket.off('typing:started', handleTypingStarted);
      socket.off('typing:stopped', handleTypingStopped);
      socket.emit('conversation:leave', conversationId);
      setActiveConversationId(undefined);
    };
  }, [connectRealtime, conversationId, currentUser?.id, otherUser?.id, setActiveConversationId, setConversationRead]);

  useEffect(() => {
    if (otherUser?.id) requestPresence([otherUser.id]);
  }, [otherUser?.id, requestPresence]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [isOtherTyping, messages.length]);

  const sendMessage = async () => {
    const token = getUserAccessToken();
    if (!token || !otherUser || !message.trim() || isSendingRef.current) return;

    setError('');
    isSendingRef.current = true;
    setIsSending(true);

    try {
      const response = await api.post<{ data: ChatMessage }>(
        '/chat/messages',
        {
          conversationId,
          receiverId: otherUser.id,
          content: message.trim(),
          type: 'TEXT'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      appendMessage(response.data.data);
      setMessage('');
      window.clearTimeout(typingTimeoutRef.current);
      getRealtimeSocket()?.emit('typing:stopped', { conversationId, userId: currentUser?.id });
    } catch {
      setError(text.sendError);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage();
  };

  const handleMessageKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    await sendMessage();
  };

  const updateMessageDraft = (value: string) => {
    setMessage(value);
    if (!currentUser?.id) return;

    const socket = getRealtimeSocket();
    socket?.emit('typing:started', { conversationId, userId: currentUser.id });
    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      socket?.emit('typing:stopped', { conversationId, userId: currentUser.id });
    }, 900);
  };

  useEffect(() => {
    return () => window.clearTimeout(typingTimeoutRef.current);
  }, []);

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

      {isLoading ? (
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-gray-500 shadow-sm">{text.loading}</div>
        </main>
      ) : error && !conversation ? (
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-red-600 shadow-sm">{error}</div>
        </main>
      ) : conversation ? (
        <div className="flex max-h-[90vh] flex-col bg-gray-50 lg:h-[calc(100vh-132px)] lg:max-h-none" dir={dir}>
          <div className="sticky top-[100px] z-30 border-b border-gray-200 bg-white px-4 py-3 lg:static">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div className="flex items-center gap-3">
                <Link className="rounded-lg p-2 transition hover:bg-gray-100" href={localizedPath('/chats')}>
                  <ArrowRight size={20} />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-600 to-teal-600 font-bold text-white">
                    {otherUser?.avatar ? <img src={otherUser.avatar} alt={otherUser.fullName} className="h-full w-full object-cover" /> : <User size={20} />}
                  </div>
                  <div>
                    <h2 className="font-bold">{otherUser?.fullName ?? '-'}</h2>
                    <p className="text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${isOtherUserOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                        {isOtherUserOnline ? text.online : text.offline}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {otherUser?.phone ? (
                  <a href={`tel:${otherUser.phone}`} className="rounded-lg p-2 transition hover:bg-gray-100">
                    <Phone size={20} />
                  </a>
                ) : null}
                <button className="rounded-lg p-2 transition hover:bg-gray-100" type="button">
                  <EllipsisVertical size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              <div className="border-b border-gray-200 bg-white lg:hidden">
                <AdSummaryCard ad={conversation.ad} locale={locale} localizedPath={localizedPath} text={text.aboutAd} />
              </div>

              <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-auto">
                <div className={`space-y-4 px-4 pt-6 ${isOtherTyping ? 'pb-8' : 'pb-4'}`}>
                  {messages.length === 0 ? <p className="text-center text-sm font-bold text-gray-400">{text.noMessages}</p> : null}
                  {messages.map((item) => {
                    const mine = item.senderId === currentUser?.id;
                    return (
                      <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%]">
                          <div className={`rounded-2xl px-4 py-3 ${mine ? 'rounded-br-sm bg-green-600 text-white' : 'rounded-bl-sm bg-white text-gray-900 shadow-sm'}`}>
                            <p className="text-sm leading-relaxed">{item.content}</p>
                          </div>
                          <div className={`mt-1 flex items-center gap-1 px-2 text-xs text-gray-500 ${mine ? 'justify-end text-right' : 'justify-start text-left'}`}>
                            <span>{formatTime(item.createdAt)}</span>
                            {mine ? (
                              item.isRead || isOtherUserOnline ? (
                                <CheckCheck size={15} className={item.isRead ? 'text-blue-500' : 'text-gray-400'} />
                              ) : (
                                <Check size={15} className="text-gray-400" />
                              )
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isOtherTyping ? (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-sm border border-green-100 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-green-700">{text.typing}</span>
                          <span className="flex items-center gap-1">
                            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-green-500 [animation-delay:-0.2s]" />
                            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-green-500 [animation-delay:-0.1s]" />
                            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-green-500" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div ref={bottomRef} />
                </div>
              </div>

              {error ? <p className="bg-red-50 px-4 py-2 text-center text-sm font-bold text-red-600">{error}</p> : null}
              <form onSubmit={submit} className="border-t border-gray-200 bg-white px-4 py-4">
                <div className="flex items-center gap-3">
                  <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition hover:bg-gray-100" type="button">
                    <Image size={20} className="text-gray-600" />
                  </button>
                  <div className="relative flex-1">
                    <textarea
                      value={message}
                      onChange={(event) => updateMessageDraft(event.target.value)}
                      onKeyDown={handleMessageKeyDown}
                      placeholder={text.placeholder}
                      rows={1}
                      className="block h-12 max-h-[120px] w-full resize-none rounded-lg border border-gray-300 px-4 py-3 leading-6 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button
                    disabled={isSending || !message.trim()}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition ${
                      message.trim() ? 'bg-green-600 text-white hover:bg-green-700' : 'cursor-not-allowed bg-gray-100 text-gray-400'
                    }`}
                    type="submit"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <AdSummaryCard ad={conversation.ad} locale={locale} localizedPath={localizedPath} text={text.aboutAd} vertical />
              </div>
            </aside>
          </div>
        </div>
      ) : null}

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

function formatPrice(price: string | number | null | undefined, currency: string, locale: 'ar' | 'en') {
  if (price === null || price === undefined || price === '') return '-';
  const value = Number(price).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US');
  return locale === 'en' ? `${currency === 'OMR' ? 'OMR' : currency} ${value}` : `${value} ${currency === 'OMR' ? 'ر.ع' : currency}`;
}

function AdSummaryCard({
  ad,
  locale,
  localizedPath,
  text,
  vertical = false
}: {
  ad: ChatAd;
  locale: 'ar' | 'en';
  localizedPath: (href: string) => string;
  text: string;
  vertical?: boolean;
}) {
  return (
    <Link
      className={`flex gap-3 p-3 transition hover:bg-gray-50 ${vertical ? 'flex-col' : 'items-center'}`}
      href={localizedPath(`/listing/${ad.id}`)}
    >
      <img
        src={ad.images?.[0]?.imageUrl ?? fallbackImage}
        alt={ad.title}
        className={vertical ? 'h-44 w-full rounded-xl object-cover' : 'h-16 w-16 rounded-lg object-cover'}
      />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs text-gray-500">{text}</p>
        <h3 className="mb-1 line-clamp-2 text-sm font-bold">{ad.title}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="font-bold text-green-600">{formatPrice(ad.price, ad.currency, locale)}</span>
          <span>• {ad.area || ad.city || '-'}</span>
        </div>
      </div>
    </Link>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}
