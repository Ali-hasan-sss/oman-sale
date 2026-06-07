'use client';

import { useCallback, useState } from 'react';

import { api } from '@/lib/api';
import {
  ApiErrorCodes,
  getApiErrorCode,
  isAssistantMessagesTooLongError
} from '@/lib/api-errors';
import type { Locale } from '@/lib/i18n';

export type AssistantAction = {
  label: string;
  href: string;
  variant?: 'primary' | 'default';
};

export type AssistantListingCard = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  city: string;
  area?: string | null;
  imageUrl?: string | null;
  isFeatured: boolean;
  badgeLabel?: string | null;
  categoryName?: string | null;
};

export type AssistantStoreCard = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  city: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  listingsCount: number;
  storeTypeName?: string | null;
  categoryName?: string | null;
};

export type QuickReplyIntent =
  | 'pricing_overview'
  | 'search_car_showrooms'
  | 'featured_listings'
  | 'create_store'
  | 'promote_listing'
  | 'post_ad'
  | 'browse_stores'
  | 'contact';

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  listings?: AssistantListingCard[];
  stores?: AssistantStoreCard[];
  actions?: AssistantAction[];
};

type ChatResponse = {
  data: {
    reply: string;
    listings: AssistantListingCard[];
    stores: AssistantStoreCard[];
    actions: AssistantAction[];
  };
};

type AssistantErrorCopy = {
  generic: string;
  dailyLimitAuth: string;
  dailyLimitGuest: string;
  conversationTooLong: string;
  rateLimited: string;
};

const STORAGE_KEY = 'oman-sale-assistant-messages';
const CONTEXT_MESSAGE_LIMIT = 20;

function loadStoredMessages(): AssistantMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssistantMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: AssistantMessage[]) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function resolveAssistantError(error: unknown, isAuthenticated: boolean, copy: AssistantErrorCopy) {
  const code = getApiErrorCode(error);

  if (code === ApiErrorCodes.ASSISTANT_DAILY_LIMIT_REACHED) {
    return isAuthenticated ? copy.dailyLimitAuth : copy.dailyLimitGuest;
  }

  if (code === ApiErrorCodes.VALIDATION_FAILED && isAssistantMessagesTooLongError(error)) {
    return copy.conversationTooLong;
  }

  if (code === ApiErrorCodes.VALIDATION_FAILED) {
    return copy.conversationTooLong;
  }

  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 429) {
    return isAuthenticated ? copy.dailyLimitAuth : copy.rateLimited;
  }

  return copy.generic;
}

export function useAssistantChat(
  locale: Locale,
  welcomeMessages: AssistantMessage[],
  isAuthenticated = false,
  errorCopy: AssistantErrorCopy
) {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    const stored = loadStoredMessages();
    return stored.length > 0 ? stored : welcomeMessages;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const clearConversation = useCallback(() => {
    setMessages(welcomeMessages);
    setError('');
    sessionStorage.removeItem(STORAGE_KEY);
  }, [welcomeMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: AssistantMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString()
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setIsLoading(true);
      setError('');

      try {
        const payload = nextMessages
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .slice(-CONTEXT_MESSAGE_LIMIT)
          .map((message) => ({ role: message.role, content: message.content }));

        const response = await api.post<ChatResponse>('/assistant/chat', {
          locale,
          isAuthenticated,
          messages: payload
        });

        const assistantMessage: AssistantMessage = {
          id: createId(),
          role: 'assistant',
          content: response.data.data.reply,
          createdAt: new Date().toISOString(),
          listings: response.data.data.listings,
          stores: response.data.data.stores,
          actions: response.data.data.actions
        };

        const updated = [...nextMessages, assistantMessage];
        setMessages(updated);
        saveMessages(updated);
      } catch (error) {
        setError(resolveAssistantError(error, isAuthenticated, errorCopy));
        setMessages(nextMessages);
      } finally {
        setIsLoading(false);
      }
    },
    [errorCopy, isAuthenticated, isLoading, locale, messages]
  );

  const sendQuickReply = useCallback(
    async (intent: QuickReplyIntent, displayText: string) => {
      const trimmed = displayText.trim();
      if (!trimmed || isLoading) return;

      const userMessage: AssistantMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString()
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setIsLoading(true);
      setError('');

      try {
        const response = await api.post<ChatResponse>('/assistant/quick-reply', {
          locale,
          intent
        });

        const assistantMessage: AssistantMessage = {
          id: createId(),
          role: 'assistant',
          content: response.data.data.reply,
          createdAt: new Date().toISOString(),
          listings: response.data.data.listings,
          stores: response.data.data.stores,
          actions: response.data.data.actions
        };

        const updated = [...nextMessages, assistantMessage];
        setMessages(updated);
        saveMessages(updated);
      } catch {
        setError(errorCopy.generic);
        setMessages(nextMessages);
      } finally {
        setIsLoading(false);
      }
    },
    [errorCopy.generic, isLoading, locale, messages]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendQuickReply,
    clearConversation
  };
}
