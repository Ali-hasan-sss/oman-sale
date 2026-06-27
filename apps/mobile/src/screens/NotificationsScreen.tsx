import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { useI18n } from '../i18n';
import { useNotificationsStore } from '../stores/notifications-store';
import { colors } from '../theme';

export function NotificationsScreen() {
  const { locale, t } = useI18n();
  const items = useNotificationsStore((state) => state.items);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);

  const localizedText = (item: (typeof items)[number]) => {
    const metadata = item.metadata as { titleEn?: string; bodyEn?: string } | null | undefined;
    if (locale === 'en' && metadata?.titleEn && metadata?.bodyEn) {
      return { title: metadata.titleEn, body: metadata.bodyEn };
    }
    return { title: item.title, body: item.body };
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t.common.notifications}</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={() => void markAllRead()} style={styles.markAllButton}>
            <Text style={styles.markAllText}>{t.common.markAllRead}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {items.length === 0 ? (
          <EmptyState message={t.common.noNotifications} />
        ) : (
          items.map((item) => {
            const text = localizedText(item);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (!item.isRead) void markRead(item.id);
                }}
                style={[styles.card, !item.isRead && styles.cardUnread]}
              >
                <Text style={styles.cardTitle}>{text.title}</Text>
                <Text style={styles.cardBody}>{text.body}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  markAllText: {
    color: colors.brand,
    fontWeight: '700',
    fontSize: 12
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 12
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16
  },
  cardUnread: {
    backgroundColor: '#f0fdf4'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink
  },
  cardBody: {
    marginTop: 6,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20
  },
  cardDate: {
    marginTop: 10,
    fontSize: 11,
    color: colors.muted
  }
});
