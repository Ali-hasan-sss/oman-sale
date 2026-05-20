import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { EmptyState } from '../components/EmptyState';
import { ChatListSkeleton } from '../components/skeleton';
import { formatChatRelativeTime } from '../data';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { hasMorePages } from '../lib/pagination';
import { getCachedChatConversations, setCachedChatConversations } from '../lib/screen-data-cache';
import { fetchConversations } from '../services/chat.service';
import { useAuthStore, useChatStore } from '../stores';
import type { ChatConversation } from '../types';
import { colors, radius, shadow } from '../theme';

const CHAT_PAGE_SIZE = 20;

type ChatScreenProps = {
  onConversationPress: (conversationId: string) => void;
};

function getOtherUser(conversation: ChatConversation, currentUserId?: string) {
  return conversation.participants.find((participant) => participant.userId !== currentUserId)?.user;
}

export function ChatScreen({ onConversationPress }: ChatScreenProps) {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const text = t.chat;

  const listRefreshToken = useChatStore((state) => state.listRefreshToken);
  const unreadByConversation = useChatStore((state) => state.unreadByConversation);
  const requestPresence = useChatStore((state) => state.requestPresence);
  const syncUnreadFromConversations = useChatStore((state) => state.syncUnreadFromConversations);
  const refreshUnreadCount = useChatStore((state) => state.refreshUnreadCount);
  const isUserOnline = useChatStore((state) => state.isUserOnline);

  const [conversations, setConversations] = useState<ChatConversation[]>(() => getCachedChatConversations());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(() => getCachedChatConversations().length > 0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  hasMoreRef.current = hasMore;

  const syncPresenceAndUnread = useCallback(
    (list: ChatConversation[]) => {
      if (user?.id) syncUnreadFromConversations(list, user.id);
      refreshUnreadCount().catch(() => undefined);
      const otherIds = list
        .map((conversation) => getOtherUser(conversation, user?.id)?.id)
        .filter(Boolean) as string[];
      if (otherIds.length > 0) requestPresence(otherIds);
    },
    [refreshUnreadCount, requestPresence, syncUnreadFromConversations, user?.id]
  );

  const loadPage = useCallback(
    async (nextPage: number, options?: { refresh?: boolean; showLoader?: boolean }) => {
      if (!accessToken) return;

      const refresh = options?.refresh ?? false;
      const showLoader = options?.showLoader ?? (!hasLoadedOnce && nextPage === 1);

      if (nextPage > 1) {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        loadingMoreRef.current = true;
        setIsLoadingMore(true);
      } else if (refresh) {
        setIsRefreshing(true);
      } else if (showLoader) {
        setIsLoading(true);
      }

      try {
        const result = await fetchConversations(nextPage, CHAT_PAGE_SIZE);
        const batch = result.items;

        setConversations((current) => {
          const merged = nextPage === 1 ? batch : [...current, ...batch];
          setCachedChatConversations(merged);
          syncPresenceAndUnread(merged);
          setHasMore(hasMorePages(merged.length, batch.length, CHAT_PAGE_SIZE, result.total));
          return merged;
        });
        setPage(nextPage);
      } catch {
        if (nextPage === 1 && !hasLoadedOnce) {
          setConversations([]);
          setHasMore(false);
        }
      } finally {
        if (showLoader) setHasLoadedOnce(true);
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
        loadingMoreRef.current = false;
      }
    },
    [accessToken, hasLoadedOnce, syncPresenceAndUnread]
  );

  useEffect(() => {
    if (!accessToken) return;
    const cached = getCachedChatConversations();
    const hasCache = cached.length > 0;
    if (hasCache) setConversations(cached);
    setPage(hasCache ? 1 : 0);
    setHasMore(true);
    loadPage(1, { showLoader: !hasCache, refresh: hasCache }).catch(() => undefined);
  }, [accessToken, locale, loadPage]);

  useEffect(() => {
    if (!hasLoadedOnce || listRefreshToken === 0) return;
    loadPage(1, { showLoader: false }).catch(() => undefined);
  }, [hasLoadedOnce, listRefreshToken, loadPage]);

  const handleRefresh = useCallback(() => {
    setHasMore(true);
    loadPage(1, { refresh: true }).catch(() => undefined);
  }, [loadPage]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading || search.trim()) return;
    loadPage(page + 1).catch(() => undefined);
  }, [hasMore, isLoadingMore, isLoading, loadPage, page, search]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) => {
      const other = getOtherUser(conversation, user?.id);
      const lastMessage = conversation.messages[0]?.content ?? '';
      return [conversation.ad.title, other?.fullName, lastMessage]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [conversations, search, user?.id]);

  const listHeader = (
    <View style={styles.headerBlock}>
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{text.title}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{text.subtitle}</AppText>
      <AppTextInput
        value={search}
        onChangeText={setSearch}
        placeholder={text.search}
        placeholderTextColor={colors.muted}
        style={[styles.search, isRtl ? styles.searchRtl : styles.searchLtr]}
      />
    </View>
  );

  const renderConversation = ({ item: conversation }: { item: ChatConversation }) => {
    const other = getOtherUser(conversation, user?.id);
    const lastMessage = conversation.messages[0];
    const unreadCount = unreadByConversation[conversation.id] ?? conversation.unreadCount ?? 0;
    const hasUnread = unreadCount > 0;
    const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);
    const otherOnline = other?.id ? isUserOnline(other.id) : false;
    const image = conversation.ad.images?.[0]?.imageUrl;

    return (
      <Pressable
        style={[styles.row, isRtl && styles.rowRtl]}
        onPress={() => onConversationPress(conversation.id)}
      >
        <View style={styles.thumbWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="image-outline" size={20} color={colors.muted} />
            </View>
          )}
          {hasUnread ? (
            <View style={styles.thumbBadge}>
              <AppText style={styles.thumbBadgeText}>{badgeLabel}</AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <View style={[styles.top, isRtl && styles.topRtl]}>
            <View style={[styles.nameRow, isRtl && styles.nameRowRtl]}>
              <AppText style={[styles.name, isRtl ? styles.rtl : styles.ltr]} numberOfLines={1}>
                {other?.fullName ?? '-'}
              </AppText>
              <View
                style={[styles.onlineDot, otherOnline ? styles.onlineDotOn : styles.onlineDotOff]}
              />
            </View>
            <AppText style={styles.time}>
              {formatChatRelativeTime(
                lastMessage?.createdAt ?? conversation.lastMessageAt ?? conversation.updatedAt,
                locale
              )}
            </AppText>
          </View>
          <AppText style={[styles.adTitle, isRtl ? styles.rtl : styles.ltr]} numberOfLines={1}>
            {conversation.ad.title}
          </AppText>
          <AppText
            style={[styles.message, isRtl ? styles.rtl : styles.ltr, hasUnread && styles.messageUnread]}
            numberOfLines={1}
          >
            {lastMessage?.content ?? text.noMessages}
          </AppText>
          {hasUnread ? (
            <View style={[styles.unreadRow, isRtl && styles.unreadRowRtl]}>
              <View style={styles.unreadDot} />
              <AppText style={styles.unreadLabel}>{text.newMessage}</AppText>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  if (!accessToken) {
    return (
      <View style={[styles.guestWrap, { paddingBottom: scrollBottomPadding }]}>
        {listHeader}
        <EmptyState message={t.common.loginRequiredHint} />
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={renderConversation}
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        isLoading && conversations.length === 0 ? (
          <ChatListSkeleton count={6} />
        ) : !isLoading ? (
          <EmptyState message={text.empty} />
        ) : null
      }
      ListFooterComponent={
        isLoadingMore && !search.trim() ? (
          <ActivityIndicator color={colors.brand} style={styles.footerLoader} />
        ) : (
          <View style={styles.footerSpacer} />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.brand]}
          tintColor={colors.brand}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.35}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    flexGrow: 1
  },
  guestWrap: {
    padding: 16,
    flex: 1
  },
  headerBlock: {
    paddingTop: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
    marginBottom: 16
  },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16
  },
  searchRtl: {
    textAlign: 'right'
  },
  searchLtr: {
    textAlign: 'left'
  },
  loader: {
    marginTop: 24
  },
  footerLoader: {
    marginVertical: 20
  },
  footerSpacer: {
    height: 8
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    ...shadow
  },
  rowRtl: {
    flexDirection: 'row-reverse'
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'visible',
    position: 'relative'
  },
  thumbBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.surface
  },
  thumbBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800'
  },
  thumb: {
    width: '100%',
    height: '100%'
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: {
    flex: 1,
    minWidth: 0
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4
  },
  topRtl: {
    flexDirection: 'row-reverse'
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0
  },
  nameRowRtl: {
    flexDirection: 'row-reverse'
  },
  name: {
    flex: 1,
    fontWeight: '800',
    color: colors.ink
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  onlineDotOn: {
    backgroundColor: colors.brand
  },
  onlineDotOff: {
    backgroundColor: '#94a3b8'
  },
  time: {
    color: colors.muted,
    fontSize: 11
  },
  adTitle: {
    color: colors.brandDark,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 2
  },
  message: {
    color: colors.muted,
    fontSize: 13
  },
  messageUnread: {
    color: colors.ink,
    fontWeight: '700'
  },
  unreadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  unreadRowRtl: {
    flexDirection: 'row-reverse'
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand
  },
  unreadLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
