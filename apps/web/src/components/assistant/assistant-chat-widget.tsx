'use client';

import { ArrowUp, Bot, Maximize2, Sparkles, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AssistantListingCarousel } from '@/components/assistant/assistant-listing-carousel';
import { AssistantStoreCarousel } from '@/components/assistant/assistant-store-carousel';
import { AssistantTypingIndicator } from '@/components/assistant/assistant-typing-indicator';
import { useAssistantChat, type AssistantMessage, type QuickReplyIntent } from '@/hooks/use-assistant-chat';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/store/auth-store';
import { formatAssistantMessage } from '@/lib/assistant-message-format';

const ASSISTANT_TEASER_STORAGE_KEY = 'oman_sale_assistant_teaser_dismissed';

function formatMessageTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function AssistantChatWidget() {
  const pathname = usePathname();
  const { locale, dir, m, localizedPath } = useI18n();
  const t = m.assistant;
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [teaserDismissed, setTeaserDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return window.localStorage.getItem(ASSISTANT_TEASER_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const user = useAuthStore((state) => state.user);
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const dismissTeaser = () => {
    setTeaserDismissed(true);
    try {
      window.localStorage.setItem(ASSISTANT_TEASER_STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  };

  const isAuthenticated = Boolean(user);

  const welcomeMessages = useMemo<AssistantMessage[]>(
    () => [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: t.welcome,
        createdAt: new Date().toISOString()
      },
      {
        id: 'welcome-2',
        role: 'assistant',
        content: t.welcomeHint,
        createdAt: new Date().toISOString()
      }
    ],
    [t.welcome, t.welcomeHint]
  );

  const { messages, isLoading, error, sendMessage, sendQuickReply, clearConversation } = useAssistantChat(
    locale,
    welcomeMessages,
    isAuthenticated,
    {
      generic: t.errorGeneric,
      dailyLimitAuth: t.errorDailyLimitAuth,
      dailyLimitGuest: t.errorDailyLimitGuest,
      conversationTooLong: t.errorConversationTooLong,
      rateLimited: t.errorRateLimited
    }
  );

  const hidden =
    pathname.includes('/admin') ||
    pathname.includes('/chat/') ||
    pathname.endsWith('/chats');

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading, open]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  }, [draft, open]);

  if (hidden) return null;

  const panelClass = expanded
    ? 'fixed inset-4 z-[90] sm:inset-auto sm:bottom-6 sm:end-6 sm:h-[min(720px,calc(100vh-3rem))] sm:w-[min(420px,calc(100vw-2rem))]'
    : open
      ? 'fixed bottom-6 end-6 z-[90] h-[min(560px,calc(100vh-5rem))] w-[min(400px,calc(100vw-2rem))]'
      : '';

  const handleSend = () => {
    if (!draft.trim()) return;
    void sendMessage(draft);
    setDraft('');
  };

  return (
    <>
      {!open ? (
        <div className="fixed bottom-6 end-6 z-[80] flex flex-col items-end gap-3">
          {!teaserDismissed ? (
            <div className="animate-assistant-teaser relative max-w-[min(260px,calc(100vw-5rem))]">
              <div className="relative rounded-2xl border border-brand-100 bg-white px-4 py-3 pe-10 shadow-xl shadow-brand-900/10">
                <button
                  type="button"
                  onClick={dismissTeaser}
                  className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={t.dismissTeaser}
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="mb-1 flex items-center gap-1.5 text-brand-700">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-black">{t.title}</span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-700">{t.teaser}</p>
              </div>
              <span className="absolute -bottom-2 end-6 h-4 w-4 rotate-45 border-b border-r border-brand-100 bg-white" aria-hidden />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              dismissTeaser();
              setOpen(true);
            }}
            className="animate-assistant-float group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-700/35 transition hover:scale-105 hover:from-brand-600 hover:to-brand-800"
            aria-label={t.openAssistant}
          >
            <span className="absolute inset-0 rounded-full bg-brand-500/30 animate-assistant-pulse" aria-hidden />
            <span className="absolute -top-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-950 shadow-sm">
              AI
            </span>
            <Bot className="relative h-7 w-7 transition group-hover:scale-110" />
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          className={`flex flex-col overflow-hidden rounded-2xl border border-[#EFEFEF] bg-white text-[#2B2B2B] shadow-2xl ${panelClass}`}
          dir={dir}
        >
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#EFEFEF] bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-brand-100">
                  <img src="/logo.png" alt="Oman Sale" className="h-7 w-7 object-contain" />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
                  <Bot className="h-4 w-4" />
                </span>
              </div>
              <span className="truncate text-sm font-medium text-[#2B2B2B]">{t.title}</span>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6B6B] transition-colors hover:bg-[#EFEFEF]"
                aria-label={expanded ? t.collapse : t.expand}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={clearConversation}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6B6B] transition-colors hover:bg-[#EFEFEF]"
                aria-label={t.clearChat}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setExpanded(false);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6B6B] transition-colors hover:bg-[#EFEFEF]"
                aria-label={t.closeChat}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="assistant-scrollbar-none relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
            <div className="pb-1 pt-2">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                const displayContent = isUser ? message.content : formatAssistantMessage(message.content);
                return (
                  <div key={message.id} className={`flex flex-col px-4 py-1 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`flex min-w-0 flex-col gap-1 ${isUser ? 'max-w-[88%] items-end' : 'w-full max-w-[min(100%,540px)] items-start'}`}>
                      {message.listings && message.listings.length > 0 ? (
                        <div className="w-full rounded-2xl rounded-tl-sm bg-[#EFEFEF] px-3 py-3 text-[#2B2B2B]">
                          <p className="mb-3 text-[13px] leading-relaxed">{displayContent}</p>
                          <AssistantListingCarousel listings={message.listings} />
                        </div>
                      ) : message.stores && message.stores.length > 0 ? (
                        <div className="w-full rounded-2xl rounded-tl-sm bg-[#EFEFEF] px-3 py-3 text-[#2B2B2B]">
                          <p className="mb-3 text-[13px] leading-relaxed">{displayContent}</p>
                          <AssistantStoreCarousel stores={message.stores} />
                        </div>
                      ) : (
                        <div
                          className={`inline-block max-w-full whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            isUser
                              ? 'rounded-tr-sm bg-brand-600 text-white'
                              : 'rounded-tl-sm bg-[#EFEFEF] text-[#2B2B2B]'
                          }`}
                        >
                          {displayContent}
                        </div>
                      )}

                      {!isUser && message.actions && message.actions.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.actions.map((action) => {
                            const href = action.href.startsWith('http') || action.href.startsWith('mailto:') || action.href.startsWith('tel:')
                              ? action.href
                              : localizedPath(action.href.replace(/^\/(ar|en)/, '') || '/');
                            const isPrimary = action.variant === 'primary';
                            return (
                              <Link
                                key={`${message.id}-${action.label}`}
                                href={href}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  isPrimary
                                    ? 'border-brand-600 bg-brand-600 text-white hover:opacity-90'
                                    : 'border-[#D8D8D8] bg-white text-[#2B2B2B] hover:bg-[#FAFAFA]'
                                }`}
                              >
                                {action.label}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                    <time className={`mt-0.5 px-1 text-[10px] font-normal text-[#B0B0B0] ${isUser ? 'self-end' : 'self-start'}`}>
                      {formatMessageTime(message.createdAt, locale)}
                    </time>
                  </div>
                );
              })}

              {isLoading ? (
                <div className="flex flex-col px-4 py-1 items-start">
                  <AssistantTypingIndicator label={t.typing} />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 px-4 pb-1 pt-1.5">
              {t.quickReplies.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={isLoading}
                  onClick={() => void sendQuickReply(chip.intent as QuickReplyIntent, chip.message)}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs whitespace-nowrap transition-colors disabled:opacity-50 ${
                    chip.primary
                      ? 'border-brand-600 bg-brand-600 font-medium text-white hover:opacity-90'
                      : 'border-[#D8D8D8] bg-white text-[#2B2B2B] hover:bg-[#FAFAFA] active:bg-[#F5F5F5]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="px-4 py-1 text-xs font-medium text-red-600">{error}</p> : null}

          <footer className="shrink-0 border-t border-[#EFEFEF] bg-white px-3 py-2.5">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t.placeholder}
                rows={1}
                disabled={isLoading}
                className="assistant-scrollbar-none max-h-[100px] min-h-[36px] flex-1 resize-none rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#9B9B9B] focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                disabled={isLoading || !draft.trim()}
                onClick={handleSend}
                aria-label={t.send}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-opacity ${
                  isLoading || !draft.trim() ? 'cursor-not-allowed opacity-35' : 'hover:opacity-90'
                }`}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </footer>
        </div>
      ) : null}
    </>
  );
}
