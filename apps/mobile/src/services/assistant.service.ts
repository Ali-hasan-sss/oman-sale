import type { ApiEnvelope } from '../lib/api/types';
import type { AssistantChatResult, QuickReplyIntent } from '../types/assistant';
import type { Locale } from '../types';
import { http } from '../lib/api/client';
import { API_ENDPOINTS } from '../lib/api/endpoints';

export async function postAssistantChat(input: {
  locale: Locale;
  isAuthenticated: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}) {
  const response = await http.post<ApiEnvelope<AssistantChatResult>>(API_ENDPOINTS.assistant.chat, input);
  return response.data.data;
}

export async function postAssistantQuickReply(input: { locale: Locale; intent: QuickReplyIntent }) {
  const response = await http.post<ApiEnvelope<AssistantChatResult>>(API_ENDPOINTS.assistant.quickReply, input);
  return response.data.data;
}
