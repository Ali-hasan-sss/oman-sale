import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n';
import { insetEnd, rowDirection } from '../lib/layout-direction';
import { colors } from '../theme';

/** Matches `assets/nav-logo.png` (84×104 @1x). */
const NAV_LOGO_WIDTH = 48;
const NAV_LOGO_HEIGHT = 60;

type AppHeaderProps = {
  onMenuPress: () => void;
  onSearchPress: () => void;
  onNotificationsPress: () => void;
  notificationUnreadCount?: number;
};

export function AppHeader({
  onMenuPress,
  onSearchPress,
  onNotificationsPress,
  notificationUnreadCount = 0
}: AppHeaderProps) {
  const { isRtl } = useI18n();

  return (
    <View style={[styles.header, rowDirection(isRtl)]}>
      <View style={styles.brand}>
        <Image
          source={require('../../assets/nav-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          {...(Platform.OS === 'android' ? { resizeMethod: 'resize' as const } : {})}
        />
      </View>
      <View style={styles.headerSpacer} />
      <View style={[styles.headerActions, rowDirection(isRtl)]}>
        <Pressable style={styles.iconButton} onPress={onSearchPress} accessibilityRole="button">
          <Ionicons name="search" size={22} color={colors.ink} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={onNotificationsPress} accessibilityRole="button">
          <Ionicons name="notifications-outline" size={22} color={colors.ink} />
          {notificationUnreadCount > 0 ? (
            <View style={[styles.badge, insetEnd(isRtl, 4)]}>
              <Text style={styles.badgeText}>{notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable style={styles.iconButton} onPress={onMenuPress} accessibilityRole="button">
          <Ionicons name="menu" size={24} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  headerSpacer: {
    flex: 1
  },
  headerActions: {
    alignItems: 'center',
    gap: 8
  },
  brand: {
    alignItems: 'center',
    justifyContent: 'center',
    width: NAV_LOGO_WIDTH,
    height: NAV_LOGO_HEIGHT,
    marginHorizontal: 8
  },
  logo: {
    width: NAV_LOGO_WIDTH,
    height: NAV_LOGO_HEIGHT
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  badge: {
    position: 'absolute',
    top: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800'
  }
});
