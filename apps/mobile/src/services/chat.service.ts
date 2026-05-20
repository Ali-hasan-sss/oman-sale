import { API_ENDPOINTS, http, type ApiEnvelope, type ApiListPage } from '../lib/api';
import { normalizePage } from '../lib/pagination';
import type { ChatConversation, ChatMessage } from '../types';

export async function fetchConversations(page = 1, limit = 20) {
  const response = await http.get<ApiEnvelope<ApiListPage<ChatConversation>>>(API_ENDPOINTS.chat.conversations, {
    params: { page, limit }
  });
  return normalizePage(response.data.data, page, limit);
}

export async function fetchConversationById(conversationId: string) {
  const response = await http.get<ApiEnvelope<ChatConversation>>(API_ENDPOINTS.chat.conversationById(conversationId));
  return response.data.data;
}

export async function fetchConversationMessages(conversationId: string) {
  const response = await http.get<ApiEnvelope<ChatMessage[]>>(API_ENDPOINTS.chat.messages(conversationId));
  return Array.isArray(response.data.data) ? response.data.data : [];
}

export async function openConversationRequest(adId: string, receiverId: string) {
  const response = await http.post<ApiEnvelope<{ id: string }>>(API_ENDPOINTS.chat.conversations, {
    adId,
    receiverId
  });
  return response.data.data;
}

export async function sendChatMessageRequest(payload: {
  conversationId: string;
  receiverId: string;
  content: string;
}) {
  const response = await http.post<ApiEnvelope<ChatMessage>>(API_ENDPOINTS.chat.sendMessage, {
    ...payload,
    type: 'TEXT'
  });
  return response.data.data;
}

export async function markConversationReadRequest(conversationId: string) {
  await http.post(API_ENDPOINTS.chat.read(conversationId));
}

export async function fetchUnreadCount() {
  const response = await http.get<ApiEnvelope<{ count: number }>>(API_ENDPOINTS.chat.unreadCount);
  return response.data.data.count;
}
