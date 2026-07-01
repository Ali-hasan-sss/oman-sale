import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../AppText';
import { KeyboardAvoidingView, composerBottomPadding, useKeyboardOpen } from '../KeyboardInsets';
import { AssistantListingCarousel } from './AssistantListingCarousel';
import { AssistantStoreCarousel } from './AssistantStoreCarousel';
import { AssistantTypingIndicator } from './AssistantTypingIndicator';
import { useAssistantChat } from '../../hooks/use-assistant-chat';
import { useI18n } from '../../i18n';
import { handleAssistantAction } from '../../lib/assistant-actions';
import { formatAssistantMessage } from '../../lib/assistant-message-format';
import { useAuthStore } from '../../stores';
import type { QuickReplyIntent } from '../../types/assistant';
import type { AssistantMessage } from '../../types/assistant';
import type { ScreenName } from '../../types';
import { colors, radius, shadow } from '../../theme';

type AssistantChatWidgetProps = {
  hidden?: boolean;
  onListingPress: (id: string) => void;
  onStorePress: (slug: string) => void;
  onNavigate: (screen: ScreenName) => void;
  onLogin: () => void;
  onRegister: () => void;
};

function formatMessageTime(value: string, locale: 'ar' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function AssistantChatWidget({
  hidden,
  onListingPress,
  onStorePress,
  onNavigate,
  onLogin,
  onRegister
}: AssistantChatWidgetProps) {
  const { locale, isRtl, t } = useI18n();
  const a = t.assistant;
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();
  const composerBottomPad = composerBottomPadding(keyboardOpen, insets.bottom);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const welcomeMessages = useMemo<AssistantMessage[]>(
    () => [
      { id: 'welcome-1', role: 'assistant', content: a.welcome, createdAt: new Date().toISOString() },
      { id: 'welcome-2', role: 'assistant', content: a.welcomeHint, createdAt: new Date().toISOString() }
    ],
    [a.welcome, a.welcomeHint]
  );

  const { messages, isLoading, error, sendMessage, sendQuickReply, clearConversation } = useAssistantChat(
    locale,
    welcomeMessages,
    isAuthenticated,
    {
      generic: a.errorGeneric,
      dailyLimitAuth: a.errorDailyLimitAuth,
      dailyLimitGuest: a.errorDailyLimitGuest,
      conversationTooLong: a.errorConversationTooLong,
      rateLimited: a.errorRateLimited
    }
  );

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages, isLoading, open]);

  if (hidden) return null;

  const close = () => setOpen(false);

  const onActionPress = (href: string) => {
    handleAssistantAction(href, {
      onListingPress,
      onStorePress,
      onNavigate,
      onLogin,
      onRegister,
      onClose: close
    });
  };

  const handleSend = () => {
    if (!draft.trim()) return;
    void sendMessage(draft);
    setDraft('');
  };

  return (
    <>
      {!open ? (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 78, right: 16 }]}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={a.openAssistant}
        >
          <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
        </Pressable>
      ) : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <KeyboardAvoidingView inModal behavior="padding" style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={close} />
          <View style={styles.panel}>
            <View style={styles.header}>
              <View style={styles.headerBrand}>
                <View style={styles.headerBrandIcons}>
                  <View style={styles.logoImageWrap}>
                    <Image
                      source={require('../../../assets/nav-logo.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                      {...(Platform.OS === 'android' ? { resizeMethod: 'resize' as const } : {})}
                    />
                  </View>
                  <View style={styles.botIconWrap}>
                    <MaterialCommunityIcons name="robot" size={18} color="#fff" />
                  </View>
                </View>
                <AppText style={styles.headerTitle}>{a.title}</AppText>
              </View>
              <View style={styles.headerActions}>
                <Pressable onPress={() => void clearConversation()} style={styles.iconBtn} accessibilityLabel={a.clearChat}>
                  <Ionicons name="trash-outline" size={20} color={colors.muted} />
                </Pressable>
                <Pressable onPress={close} style={styles.iconBtn} accessibilityLabel={a.closeChat}>
                  <Ionicons name="close" size={22} color={colors.muted} />
                </Pressable>
              </View>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            >
              {messages.map((message) => {
                const isUser = message.role === 'user';
                const displayContent = isUser ? message.content : formatAssistantMessage(message.content);

                return (
                  <View key={message.id} style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
                    {message.listings && message.listings.length > 0 ? (
                      <View style={styles.richBubble}>
                        <AppText style={[styles.bubbleText, isRtl ? styles.rtl : styles.ltr]}>{displayContent}</AppText>
                        <AssistantListingCarousel
                          listings={message.listings}
                          locale={locale}
                          featuredLabel={t.common.featured}
                          viewLabel={a.viewListing}
                          onListingPress={(id) => {
                            close();
                            onListingPress(id);
                          }}
                        />
                      </View>
                    ) : message.stores && message.stores.length > 0 ? (
                      <View style={styles.richBubble}>
                        <AppText style={[styles.bubbleText, isRtl ? styles.rtl : styles.ltr]}>{displayContent}</AppText>
                        <AssistantStoreCarousel
                          stores={message.stores}
                          locale={locale}
                          listingsLabel={t.storesBrowse.listings}
                          viewLabel={a.viewStore}
                          onStorePress={(slug) => {
                            close();
                            onStorePress(slug);
                          }}
                        />
                      </View>
                    ) : (
                      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                        <AppText style={[styles.bubbleText, isUser ? styles.userText : styles.botText, isRtl ? styles.rtl : styles.ltr]}>
                          {displayContent}
                        </AppText>
                      </View>
                    )}

                    {!isUser && message.actions && message.actions.length > 0 ? (
                      <View style={styles.actionsRow}>
                        {message.actions.map((action) => (
                          <Pressable
                            key={`${message.id}-${action.label}`}
                            style={[styles.actionBtn, action.variant === 'primary' ? styles.actionPrimary : styles.actionDefault]}
                            onPress={() => onActionPress(action.href)}
                          >
                            <AppText
                              style={[
                                styles.actionText,
                                action.variant === 'primary' ? styles.actionTextPrimary : styles.actionTextDefault
                              ]}
                            >
                              {action.label}
                            </AppText>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}

                    <AppText style={[styles.time, isUser ? styles.timeUser : styles.timeBot]}>
                      {formatMessageTime(message.createdAt, locale)}
                    </AppText>
                  </View>
                );
              })}

              {isLoading ? (
                <View style={styles.messageRowBot}>
                  <AssistantTypingIndicator label={a.typing} rtl={isRtl} />
                </View>
              ) : null}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {a.quickReplies.map((chip) => (
                <Pressable
                  key={chip.label}
                  disabled={isLoading}
                  style={[styles.chip, chip.primary ? styles.chipPrimary : styles.chipDefault, isLoading && styles.chipDisabled]}
                  onPress={() => void sendQuickReply(chip.intent as QuickReplyIntent, chip.message)}
                >
                  <AppText style={[styles.chipText, chip.primary ? styles.chipTextPrimary : styles.chipTextDefault]}>
                    {chip.label}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>

            {error ? <AppText style={styles.error}>{error}</AppText> : null}

            <View style={[styles.composer, { paddingBottom: composerBottomPad }]}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={a.placeholder}
                placeholderTextColor="#9B9B9B"
                multiline
                editable={!isLoading}
                style={[styles.input, isRtl ? styles.rtl : styles.ltr]}
                onSubmitEditing={handleSend}
              />
              <Pressable
                style={[styles.sendBtn, (!draft.trim() || isLoading) && styles.sendBtnDisabled]}
                disabled={!draft.trim() || isLoading}
                onPress={handleSend}
                accessibilityLabel={a.send}
              >
                <Ionicons name="arrow-up" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    zIndex: 50,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    elevation: 50
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.35)'
  },
  panel: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF'
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  headerBrandIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  logoImageWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1fae5'
  },
  logoImage: {
    width: 28,
    height: 32
  },
  botIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.brand
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    flexShrink: 1
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10
  },
  messages: {
    flexGrow: 0,
    flexShrink: 1
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8
  },
  messageRow: {
    maxWidth: '100%'
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '88%'
  },
  messageRowBot: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    width: '100%'
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%'
  },
  richBubble: {
    width: '100%',
    backgroundColor: '#EFEFEF',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12
  },
  userBubble: {
    backgroundColor: colors.brand,
    borderTopRightRadius: 4
  },
  botBubble: {
    backgroundColor: '#EFEFEF',
    borderTopLeftRadius: 4
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 20
  },
  userText: {
    color: '#fff'
  },
  botText: {
    color: colors.ink
  },
  rtl: {
    textAlign: 'right',
    writingDirection: 'rtl'
  },
  ltr: {
    textAlign: 'left',
    writingDirection: 'ltr'
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1
  },
  actionPrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand
  },
  actionDefault: {
    backgroundColor: colors.surface,
    borderColor: '#D8D8D8'
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700'
  },
  actionTextPrimary: {
    color: '#fff'
  },
  actionTextDefault: {
    color: colors.ink
  },
  time: {
    fontSize: 10,
    color: '#B0B0B0',
    marginTop: 4
  },
  timeUser: {
    alignSelf: 'flex-end'
  },
  timeBot: {
    alignSelf: 'flex-start'
  },
  chipsRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1
  },
  chipPrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand
  },
  chipDefault: {
    backgroundColor: colors.surface,
    borderColor: '#D8D8D8'
  },
  chipDisabled: {
    opacity: 0.5
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700'
  },
  chipTextPrimary: {
    color: '#fff'
  },
  chipTextDefault: {
    color: colors.ink
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 4
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF'
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.ink
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: {
    opacity: 0.35
  }
});
