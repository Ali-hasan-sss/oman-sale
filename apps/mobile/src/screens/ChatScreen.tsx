import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { fallbackConversations } from '../data';
import { useAuthStore } from '../stores';
import { useI18n } from '../i18n';
import { colors, radius, shadow } from '../theme';

export function ChatScreen() {
  const user = useAuthStore((state) => state.user);
  const { t, isRtl } = useI18n();
  const conversations = user ? fallbackConversations : [];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.chat.title}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.chat.subtitle}</AppText>
      {conversations.length === 0 ? (
        <EmptyState message={t.chat.empty} />
      ) : (
        conversations.map((conversation) => (
          <View key={conversation.id} style={[styles.row, isRtl && styles.rowRtl]}>
            <View style={styles.avatar}>
              <Ionicons name="chatbubble-ellipses" size={22} color={colors.brand} />
            </View>
            <View style={styles.body}>
              <View style={[styles.top, isRtl && styles.topRtl]}>
                <AppText style={[styles.name, isRtl ? styles.rtl : styles.ltr]}>{conversation.sellerName}</AppText>
                <AppText style={[styles.time, isRtl ? styles.rtl : styles.ltr]}>{conversation.updatedAt}</AppText>
              </View>
              <AppText style={[styles.adTitle, isRtl ? styles.rtl : styles.ltr]} numberOfLines={1}>
                {conversation.adTitle}
              </AppText>
              <AppText style={[styles.message, isRtl ? styles.rtl : styles.ltr]} numberOfLines={1}>
                {conversation.lastMessage}
              </AppText>
            </View>
            {conversation.unread ? <View style={styles.dot} /> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 120
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: {
    flex: 1
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  topRtl: {
    flexDirection: 'row-reverse'
  },
  name: {
    fontWeight: '800',
    color: colors.ink
  },
  time: {
    color: colors.muted,
    fontSize: 12
  },
  adTitle: {
    color: colors.brandDark,
    fontWeight: '700',
    marginBottom: 2
  },
  message: {
    color: colors.muted
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
