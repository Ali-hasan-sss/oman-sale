import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';

import { postAssistantChat, postAssistantQuickReply } from '../services/assistant.service';
import type { AssistantMessage, QuickReplyIntent } from '../types/assistant';
import type { Locale } from '../types';

type AssistantErrorCopy = {
  generic: string;
  dailyLimitAuth: string;
  dailyLimitGuest: string;
  conversationTooLong: string;
  rateLimited: string;
};

const STORAGE_KEY = 'oman-sale-assistant-messages';
const CONTEXT_MESSAGE_LIMIT = 20;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function loadStoredMessages(): Promise<AssistantMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssistantMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveMessages(messages: AssistantMessage[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
}

function getApiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const code = error.response?.data?.code;
  return typeof code === 'string' ? code : undefined;
}

function isMessagesTooLongError(error: unknown) {
  if (!isAxiosError(error)) return false;
  const issues = error.response?.data?.details?.issues;
  if (!Array.isArray(issues)) return false;
  return issues.some(
    (issue: { path?: string[]; code?: string }) =>
      issue.path?.[0] === 'messages' && (issue.code === 'too_big' || issue.code === 'too_small')
  );
}

function resolveAssistantError(error: unknown, isAuthenticated: boolean, copy: AssistantErrorCopy) {
  const code = getApiErrorCode(error);

  if (code === 'ASSISTANT_DAILY_LIMIT_REACHED') {
    return isAuthenticated ? copy.dailyLimitAuth : copy.dailyLimitGuest;
  }

  if (code === 'VALIDATION_FAILED' && isMessagesTooLongError(error)) {
    return copy.conversationTooLong;
  }

  if (code === 'VALIDATION_FAILED') {
    return copy.conversationTooLong;
  }

  if (isAxiosError(error) && error.response?.status === 429) {
    return isAuthenticated ? copy.dailyLimitAuth : copy.rateLimited;
  }

  return copy.generic;
}

export function useAssistantChat(
  locale: Locale,
  welcomeMessages: AssistantMessage[],
  isAuthenticated: boolean,
  errorCopy: AssistantErrorCopy
) {
  const [messages, setMessages] = useState<AssistantMessage[]>(welcomeMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void loadStoredMessages().then((stored) => {
      if (!active) return;
      setMessages(stored.length > 0 ? stored : welcomeMessages);
    });
    return () => {
      active = false;
    };
  }, [welcomeMessages]);

  const clearConversation = useCallback(async () => {
    setMessages(welcomeMessages);
    setError('');
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, [welcomeMessages]);

  const appendAssistantResponse = useCallback(
    async (nextMessages: AssistantMessage[], data: Awaited<ReturnType<typeof postAssistantChat>>) => {
      const assistantMessage: AssistantMessage = {
        id: createId(),
        role: 'assistant',
        content: data.reply,
        createdAt: new Date().toISOString(),
        listings: data.listings,
        stores: data.stores,
        actions: data.actions
      };
      const updated = [...nextMessages, assistantMessage];
      setMessages(updated);
      await saveMessages(updated);
    },
    []
  );

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

        const data = await postAssistantChat({
          locale,
          isAuthenticated,
          messages: payload
        });

        await appendAssistantResponse(nextMessages, data);
      } catch (err) {
        setError(resolveAssistantError(err, isAuthenticated, errorCopy));
        setMessages(nextMessages);
      } finally {
        setIsLoading(false);
      }
    },
    [appendAssistantResponse, errorCopy, isAuthenticated, isLoading, locale, messages]
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
        const data = await postAssistantQuickReply({ locale, intent });
        await appendAssistantResponse(nextMessages, data);
      } catch {
        setError(errorCopy.generic);
        setMessages(nextMessages);
      } finally {
        setIsLoading(false);
      }
    },
    [appendAssistantResponse, errorCopy.generic, isLoading, locale, messages]
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
