import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { ListingCoverImage } from '../components/ListingCoverImage';
import { ChatThreadSkeleton } from '../components/skeleton';
import { CHAT_THREAD_BAR_BODY_HEIGHT } from '../constants/chat-layout';
import { formatChatTime, formatPrice } from '../data';
import { useI18n } from '../i18n';
import { getListingLocationLabel } from '../lib/oman-locations';
import { getRealtimeSocket } from '../lib/realtime/socket';
import {
  fetchConversationById,
  fetchConversationMessages,
  markConversationReadRequest,
  sendChatMessageRequest
} from '../services/chat.service';
import { KeyboardAvoidingView, composerBottomPadding, useKeyboardOpen } from '../components/KeyboardInsets';
import { useAuthStore, useChatStore } from '../stores';
import type { ChatConversation, ChatMessage } from '../types';
import { colors, radius, shadow } from '../theme';

type ChatConversationScreenProps = {
  conversationId: string;
  onBack: () => void;
  onOpenListing: (listingId: string) => void;
};

function getOtherParticipant(conversation: ChatConversation, currentUserId?: string) {
  return conversation.participants.find((participant) => participant.userId !== currentUserId)?.user;
}

export function ChatConversationScreen({
  conversationId,
  onBack,
  onOpenListing
}: ChatConversationScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const user = useAuthStore((state) => state.user);
  const text = t.chat;

  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const requestPresence = useChatStore((state) => state.requestPresence);
  const emitTypingStarted = useChatStore((state) => state.emitTypingStarted);
  const emitTypingStopped = useChatStore((state) => state.emitTypingStopped);
  const setConversationRead = useChatStore((state) => state.setConversationRead);
  const setThreadBar = useChatStore((state) => state.setThreadBar);

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const safeInsets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [adCardVisible, setAdCardVisible] = useState(true);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrollTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated });
      });
    });
  }, []);

  const scrollToBottomReliable = useCallback(
    (animated = true) => {
      scrollToBottom(animated);
      scrollTimeoutsRef.current.forEach(clearTimeout);
      scrollTimeoutsRef.current = [
        setTimeout(() => scrollToBottom(animated), 50),
        setTimeout(() => scrollToBottom(animated), 200),
        setTimeout(() => scrollToBottom(animated), Platform.OS === 'ios' ? 400 : 300)
      ];
    },
    [scrollToBottom]
  );

  const otherUser = conversation ? getOtherParticipant(conversation, user?.id) : undefined;
  const otherUserId = otherUser?.id;

  const isOtherTyping = useChatStore((state) =>
    otherUserId ? state.isOtherTypingIn(conversationId, otherUserId) : false
  );

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      return [...current, message];
    });
  }, []);

  const loadThread = useCallback(async () => {
    try {
      const [conversationData, messageList] = await Promise.all([
        fetchConversationById(conversationId),
        fetchConversationMessages(conversationId)
      ]);
      setConversation(conversationData);
      setMessages(messageList);
      setError('');
      await markConversationReadRequest(conversationId).catch(() => undefined);
      setConversationRead(conversationId);
    } catch {
      setConversation(null);
      setMessages([]);
      setError(text.threadError);
    }
  }, [conversationId, setConversationRead, text.threadError]);

  useEffect(() => {
    setIsLoading(true);
    loadThread()
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [loadThread]);

  useEffect(() => {
    setAdCardVisible(true);
  }, [conversationId]);

  useEffect(() => {
    setThreadBar({
      conversationId,
      peerId: otherUser?.id,
      peerName: otherUser?.fullName ?? '',
      peerAvatar: otherUser?.avatar ?? null,
      peerPhone: otherUser?.phone ?? null,
      isLoading
    });
  }, [
    conversationId,
    isLoading,
    otherUser?.avatar,
    otherUser?.fullName,
    otherUser?.id,
    otherUser?.phone,
    setThreadBar
  ]);

  useEffect(() => {
    setActiveConversationId(conversationId);
    return () => {
      emitTypingStopped(conversationId);
      setActiveConversationId(null);
      setThreadBar(null);
    };
  }, [
    conversationId,
    emitTypingStopped,
    setActiveConversationId,
    setThreadBar
  ]);

  useEffect(() => {
    if (!otherUserId) return;
    requestPresence([otherUserId]);
  }, [otherUserId, requestPresence]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) return;

    const receiveMessage = (message: ChatMessage) => {
      if (message.conversationId !== conversationId) return;
      appendMessage(message);
      if (message.receiverId === user?.id) {
        markConversationReadRequest(conversationId).catch(() => undefined);
        setConversationRead(conversationId);
      }
    };

    const markMessagesRead = ({
      conversationId: readConversationId,
      readerId,
      readAt
    }: {
      conversationId: string;
      readerId: string;
      readAt: string;
    }) => {
      if (readConversationId !== conversationId || readerId !== otherUserId) return;
      setMessages((current) =>
        current.map((item) =>
          item.senderId === user?.id ? { ...item, isRead: true, readAt } : item
        )
      );
    };

    socket.on('message:received', receiveMessage);
    socket.on('message:sent', receiveMessage);
    socket.on('messages:read', markMessagesRead);

    return () => {
      socket.off('message:received', receiveMessage);
      socket.off('message:sent', receiveMessage);
      socket.off('messages:read', markMessagesRead);
    };
  }, [appendMessage, conversationId, otherUserId, setConversationRead, user?.id]);

  useEffect(() => {
    if (isLoading) return;
    scrollToBottomReliable(false);
  }, [isLoading, conversationId, scrollToBottomReliable]);

  useEffect(() => {
    if (isLoading || messages.length === 0) return;
    scrollToBottom(true);
  }, [messages.length, isOtherTyping, isLoading, scrollToBottom]);

  useEffect(() => {
    const event = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const show = Keyboard.addListener(event, () => {
      setTimeout(() => scrollToBottomReliable(true), 60);
    });
    return () => show.remove();
  }, [scrollToBottomReliable]);

  useEffect(
    () => () => {
      clearTimeout(typingTimeoutRef.current);
      scrollTimeoutsRef.current.forEach(clearTimeout);
    },
    []
  );

  const updateDraft = (value: string) => {
    setDraft(value);
    emitTypingStarted(conversationId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTypingStopped(conversationId), 900);
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !otherUser || isSending) return;

    setError('');
    setIsSending(true);
    emitTypingStopped(conversationId);
    try {
      const sent = await sendChatMessageRequest({
        conversationId,
        receiverId: otherUser.id,
        content
      });
      appendMessage(sent);
      setDraft('');
      await markConversationReadRequest(conversationId).catch(() => undefined);
    } catch {
      setError(text.sendError);
    } finally {
      setIsSending(false);
    }
  };

  const renderShell = (children: ReactNode) => (
    <KeyboardAvoidingView style={styles.root} behavior="padding">
      {children}
    </KeyboardAvoidingView>
  );

  const composerBottomPad = composerBottomPadding(keyboardOpen, safeInsets.bottom);
  const showAdCard = adCardVisible && !keyboardOpen;
  const threadTopInset = safeInsets.top + CHAT_THREAD_BAR_BODY_HEIGHT;

  if (isLoading && !conversation) {
    return renderShell(
      <View style={[styles.chatBody, { paddingTop: threadTopInset }]}>
        <ChatThreadSkeleton />
      </View>
    );
  }

  if (error && !conversation) {
    return renderShell(
      <View style={[styles.centered, { paddingTop: threadTopInset }]}>
        <AppText style={styles.errorText}>{error}</AppText>
        <Pressable style={styles.retryBtn} onPress={onBack}>
          <AppText style={styles.retryBtnText}>{t.listingDetail.back}</AppText>
        </Pressable>
      </View>
    );
  }

  if (!conversation) return null;

  const adImage = conversation.ad.images?.[0]?.imageUrl;

  return renderShell(
    <View style={styles.chatBody}>
      {showAdCard ? (
        <View style={[styles.adCardWrap, { marginTop: threadTopInset }]}>
          <Pressable
            style={[styles.adCard, isRtl && styles.adCardRtl]}
            onPress={() => onOpenListing(conversation.ad.id)}
          >
            <ListingCoverImage uri={adImage} variant="thumb" style={styles.adImage} />
            <View style={styles.adBody}>
              <AppText style={[styles.adLabel, isRtl && styles.textRtl]}>{text.aboutAd}</AppText>
              <AppText style={[styles.adTitle, isRtl && styles.textRtl]} numberOfLines={2}>
                {conversation.ad.title}
              </AppText>
              <AppText style={[styles.adMeta, isRtl && styles.textRtl]}>
                {formatPrice(conversation.ad.price, conversation.ad.currency, locale)} •{' '}
                {getListingLocationLabel(conversation.ad.city, conversation.ad.wilayah, conversation.ad.area, locale) || '-'}
              </AppText>
            </View>
            <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} />
          </Pressable>
          <Pressable
            style={[styles.adCardClose, isRtl && styles.adCardCloseRtl]}
            onPress={() => {
              setAdCardVisible(false);
              scrollToBottom(false);
            }}
            accessibilityLabel={text.hideAdCard}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.messagesContent,
          !showAdCard && { paddingTop: threadTopInset },
          messages.length > 0 && styles.messagesContentAnchored,
          messages.length === 0 && !isOtherTyping && styles.messagesContentEmpty
        ]}
        onContentSizeChange={() => scrollToBottom(false)}
        onLayout={() => {
          if (!isLoading) scrollToBottom(false);
        }}
        ListFooterComponent={
          isOtherTyping ? (
            <View style={[styles.typingRow, isRtl ? styles.typingRowRtl : styles.typingRowLtr]}>
              <View style={[styles.typingBubble, isRtl && styles.typingBubbleRtl]}>
                <AppText style={styles.typingText}>{text.typing}</AppText>
                <View style={styles.typingDots}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, styles.typingDotMid]} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          const rowAlign = mine
            ? isRtl
              ? styles.bubbleRowMineRtl
              : styles.bubbleRowMine
            : isRtl
              ? styles.bubbleRowOtherRtl
              : styles.bubbleRowOther;
          const bubbleCorner = mine
            ? isRtl
              ? styles.bubbleMineRtl
              : styles.bubbleMine
            : isRtl
              ? styles.bubbleOtherRtl
              : styles.bubbleOther;
          return (
            <View style={[styles.bubbleRow, rowAlign]}>
              <View style={[styles.bubble, styles.bubbleBase, bubbleCorner]}>
                <AppText style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.content}</AppText>
              </View>
              <View style={[styles.bubbleMeta, mine ? styles.bubbleMetaMine : styles.bubbleMetaOther]}>
                <AppText style={styles.bubbleTime}>{formatChatTime(item.createdAt, locale)}</AppText>
                {mine ? (
                  <Ionicons
                    name={item.isRead ? 'checkmark-done' : 'checkmark'}
                    size={14}
                    color={item.isRead ? '#3b82f6' : colors.muted}
                  />
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !isOtherTyping ? <AppText style={styles.emptyMessages}>{text.noMessagesYet}</AppText> : null
        }
      />

      {error ? <AppText style={styles.sendError}>{error}</AppText> : null}

      <View style={[styles.composerDock, { paddingBottom: composerBottomPad }]}>
        <View style={[styles.composer, isRtl && styles.composerRtl]}>
          <TextInput
            value={draft}
            onChangeText={updateDraft}
            onFocus={() => scrollToBottomReliable(true)}
            placeholder={text.placeholder}
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.input, isRtl && styles.inputRtl]}
            textAlign={isRtl ? 'right' : 'left'}
          />
          <Pressable
            style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={isSending || !draft.trim()}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" style={styles.sendIcon} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#efeae2'
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#efeae2'
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted
  },
  errorText: {
    color: colors.danger,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12
  },
  retryBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700'
  },
  chatBody: {
    flex: 1
  },
  adCardWrap: {
    position: 'relative',
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden'
  },
  adCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 40
  },
  adCardRtl: {
    flexDirection: 'row-reverse',
    paddingLeft: 36,
    paddingRight: 10
  },
  adCardClose: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  adCardCloseRtl: {
    right: undefined,
    left: 10
  },
  adImage: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden'
  },
  adBody: {
    flex: 1,
    minWidth: 0
  },
  adLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 2
  },
  adMeta: {
    fontSize: 12,
    color: colors.brandDark,
    fontWeight: '700'
  },
  messagesList: {
    flex: 1
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10
  },
  messagesContentAnchored: {
    flexGrow: 1,
    justifyContent: 'flex-end'
  },
  messagesContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  emptyMessages: {
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '700'
  },
  typingRow: {
    marginTop: 4
  },
  typingRowLtr: {
    alignItems: 'flex-start'
  },
  typingRowRtl: {
    alignItems: 'flex-end'
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadow
  },
  typingBubbleRtl: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4
  },
  typingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandDark
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brand
  },
  typingDotMid: {
    opacity: 0.65
  },
  bubbleRow: {
    maxWidth: '82%'
  },
  bubbleRowMine: {
    alignSelf: 'flex-end'
  },
  bubbleRowMineRtl: {
    alignSelf: 'flex-start'
  },
  bubbleRowOther: {
    alignSelf: 'flex-start'
  },
  bubbleRowOtherRtl: {
    alignSelf: 'flex-end'
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  bubbleBase: {
    borderRadius: 18
  },
  bubbleMine: {
    backgroundColor: colors.brand,
    borderBottomRightRadius: 4
  },
  bubbleMineRtl: {
    backgroundColor: colors.brand,
    borderBottomLeftRadius: 4
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    ...shadow
  },
  bubbleOtherRtl: {
    backgroundColor: colors.surface,
    borderBottomRightRadius: 4,
    ...shadow
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink
  },
  bubbleTextMine: {
    color: '#fff'
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 4
  },
  bubbleMetaMine: {
    justifyContent: 'flex-end'
  },
  bubbleMetaOther: {
    justifyContent: 'flex-start'
  },
  bubbleTime: {
    fontSize: 11,
    color: colors.muted
  },
  sendError: {
    textAlign: 'center',
    color: colors.danger,
    fontWeight: '700',
    fontSize: 12,
    paddingVertical: 4,
    backgroundColor: '#fef2f2'
  },
  composerDock: {
    zIndex: 30,
    backgroundColor: colors.surface
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  composerRtl: {
    flexDirection: 'row-reverse'
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.background,
    fontSize: 15,
    color: colors.ink
  },
  inputRtl: {
    textAlign: 'right'
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: {
    backgroundColor: colors.line
  },
  sendIcon: {
    transform: [{ scaleX: -1 }]
  },
  textRtl: {
    textAlign: 'right'
  }
});
