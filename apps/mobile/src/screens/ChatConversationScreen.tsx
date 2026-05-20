import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  type KeyboardEvent,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { ChatThreadSkeleton } from '../components/skeleton';
import { formatChatTime, formatPrice } from '../data';
import { useI18n } from '../i18n';
import { getRealtimeSocket } from '../lib/realtime/socket';
import {
  fetchConversationById,
  fetchConversationMessages,
  markConversationReadRequest,
  sendChatMessageRequest
} from '../services/chat.service';
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

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
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

  const isOtherOnline = useChatStore((state) => (otherUserId ? state.isUserOnline(otherUserId) : false));
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
    setActiveConversationId(conversationId);
    return () => {
      emitTypingStopped(conversationId);
      setActiveConversationId(null);
    };
  }, [conversationId, emitTypingStopped, setActiveConversationId]);

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
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: KeyboardEvent) => {
      if (Platform.OS === 'ios') {
        setKeyboardInset(event.endCoordinates.height);
      }
      scrollToBottomReliable(true);
    };
    const onHide = () => {
      if (Platform.OS === 'ios') {
        setKeyboardInset(0);
      }
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
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
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {children}
    </SafeAreaView>
  );

  const useKeyboardLift = Platform.OS === 'ios';
  const composerBottomPad = useKeyboardLift && keyboardInset > 0 ? 0 : 8;
  const composerLift = useKeyboardLift ? keyboardInset : 0;

  if (isLoading && !conversation) {
    return renderShell(<ChatThreadSkeleton />);
  }

  if (error && !conversation) {
    return renderShell(
      <View style={styles.centered}>
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
    <View style={styles.flex}>
      <View style={[styles.threadHeader, isRtl && styles.threadHeaderRtl]}>
        <Pressable style={styles.headerIconBtn} onPress={onBack}>
          <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={22} color={colors.ink} />
        </Pressable>
        <View style={[styles.peerRow, isRtl && styles.peerRowRtl]}>
          <View style={styles.avatar}>
            {otherUser?.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={22} color="#fff" />
            )}
          </View>
          <View style={styles.peerMeta}>
            <AppText style={[styles.peerName, isRtl && styles.textRtl]} numberOfLines={1}>
              {otherUser?.fullName ?? '-'}
            </AppText>
            <View style={[styles.statusRow, isRtl && styles.statusRowRtl]}>
              <View style={[styles.statusDot, isOtherOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
              <AppText style={styles.statusText}>{isOtherOnline ? text.online : text.offline}</AppText>
            </View>
          </View>
        </View>
        {otherUser?.phone ? (
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => Linking.openURL(`tel:${otherUser.phone}`).catch(() => undefined)}
          >
            <Ionicons name="call-outline" size={22} color={colors.brand} />
          </Pressable>
        ) : (
          <View style={styles.headerIconSpacer} />
        )}
      </View>

      {adCardVisible ? (
        <View style={styles.adCardWrap}>
          <Pressable
            style={[styles.adCard, isRtl && styles.adCardRtl]}
            onPress={() => onOpenListing(conversation.ad.id)}
          >
            {adImage ? (
              <Image source={{ uri: adImage }} style={styles.adImage} />
            ) : (
              <View style={styles.adImagePlaceholder}>
                <Ionicons name="image-outline" size={20} color={colors.muted} />
              </View>
            )}
            <View style={styles.adBody}>
              <AppText style={[styles.adLabel, isRtl && styles.textRtl]}>{text.aboutAd}</AppText>
              <AppText style={[styles.adTitle, isRtl && styles.textRtl]} numberOfLines={2}>
                {conversation.ad.title}
              </AppText>
              <AppText style={[styles.adMeta, isRtl && styles.textRtl]}>
                {formatPrice(conversation.ad.price, conversation.ad.currency, locale)} •{' '}
                {conversation.ad.area || conversation.ad.city || '-'}
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
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.messagesContent,
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

      <View
        style={[styles.composerDock, { marginBottom: composerLift, paddingBottom: composerBottomPad }]}
      >
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
  flex: {
    flex: 1
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
  threadHeader: {
    zIndex: 20,
    elevation: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  threadHeaderRtl: {
    flexDirection: 'row-reverse'
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  headerIconSpacer: {
    width: 40
  },
  peerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  peerRowRtl: {
    flexDirection: 'row-reverse'
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  peerMeta: {
    flex: 1,
    minWidth: 0
  },
  peerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  statusRowRtl: {
    flexDirection: 'row-reverse'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusDotOnline: {
    backgroundColor: colors.brand
  },
  statusDotOffline: {
    backgroundColor: '#94a3b8'
  },
  statusText: {
    fontSize: 12,
    color: colors.muted
  },
  adCardWrap: {
    position: 'relative',
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 6,
    zIndex: 20,
    elevation: 20
  },
  adCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 36,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow
  },
  adCardRtl: {
    flexDirection: 'row-reverse',
    paddingLeft: 36,
    paddingRight: 10
  },
  adCardClose: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    zIndex: 2
  },
  adCardCloseRtl: {
    right: undefined,
    left: 6
  },
  adImage: {
    width: 56,
    height: 56,
    borderRadius: radius.sm
  },
  adImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center'
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
    elevation: 30,
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
    justifyContent: 'center',
    zIndex: 31,
    elevation: 31
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
