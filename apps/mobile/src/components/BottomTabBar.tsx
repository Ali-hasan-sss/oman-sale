import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import type { ScreenName } from '../types';
import { colors, shadow } from '../theme';

type TabKey = 'home' | 'offers' | 'myOffers' | 'chat';

type BottomTabBarProps = {
  activeScreen: ScreenName;
  onChange: (screen: TabKey) => void;
  onAddPress: () => void;
  chatUnreadCount?: number;
};

const leftTabs: TabKey[] = ['chat', 'myOffers'];
const rightTabs: TabKey[] = ['offers', 'home'];

export function BottomTabBar({ activeScreen, onChange, onAddPress, chatUnreadCount = 0 }: BottomTabBarProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const labels: Record<TabKey, string> = {
    home: t.common.home,
    offers: t.common.offers,
    myOffers: t.common.myOffers,
    chat: t.common.chat
  };

  const icons: Record<TabKey, keyof typeof Ionicons.glyphMap> = {
    home: 'home',
    offers: 'grid',
    myOffers: 'albums',
    chat: 'chatbubbles'
  };

  const renderTab = (tab: TabKey) => {
    const active = activeScreen === tab;
    const showChatBadge = tab === 'chat' && chatUnreadCount > 0;
    const badgeLabel = chatUnreadCount > 9 ? '9+' : String(chatUnreadCount);

    return (
      <Pressable key={tab} style={styles.tab} onPress={() => onChange(tab)}>
        <View style={styles.tabIconWrap}>
          <Ionicons name={icons[tab]} size={22} color={active ? colors.brand : colors.muted} />
          {showChatBadge ? (
            <View style={styles.tabBadge}>
              <AppText style={styles.tabBadgeText}>{badgeLabel}</AppText>
            </View>
          ) : null}
        </View>
        <AppText style={[styles.label, active && styles.labelActive]}>{labels[tab]}</AppText>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        <View style={styles.group}>{leftTabs.map(renderTab)}</View>
        <View style={styles.fabSpace} />
        <View style={styles.group}>{rightTabs.map(renderTab)}</View>
      </View>
      <Pressable style={styles.fab} onPress={onAddPress}>
        <Ionicons name="add" size={34} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  bar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8
  },
  group: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  fabSpace: {
    width: 88
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 68,
    gap: 4
  },
  tabIconWrap: {
    position: 'relative'
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800'
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted
  },
  labelActive: {
    color: colors.brand
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    top: -28,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.surface,
    ...shadow
  }
});
