import { ChatConversationPage } from '@/components/chat/chat-conversation-page';

export default function ChatConversationRoute({ params }: { params: { conversationId: string } }) {
  return <ChatConversationPage conversationId={params.conversationId} />;
}
