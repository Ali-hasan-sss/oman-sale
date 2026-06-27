import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n';
import { colors } from '../theme';

/** Matches `assets/nav-logo.png` (92×104 @1x). */
const NAV_LOGO_WIDTH = 46;
const NAV_LOGO_HEIGHT = 52;

type AppHeaderProps = {
  onMenuPress: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  notificationUnreadCount?: number;
};

export function AppHeader({
  onMenuPress,
  showBack,
  onBackPress,
  onSearchPress,
  onNotificationsPress,
  notificationUnreadCount = 0
}: AppHeaderProps) {
  const { isRtl } = useI18n();

  return (
    <View style={styles.header}>
      <View style={styles.headerStart}>
        {showBack ? (
          <Pressable style={styles.iconButton} onPress={onBackPress}>
            <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.ink} />
          </Pressable>
        ) : (
          <>
            <Pressable style={styles.iconButton} onPress={onMenuPress}>
              <Ionicons name="menu" size={24} color={colors.ink} />
            </Pressable>
            {onSearchPress ? (
              <Pressable style={styles.iconButton} onPress={onSearchPress} accessibilityRole="button">
                <Ionicons name="search" size={22} color={colors.ink} />
              </Pressable>
            ) : null}
            {onNotificationsPress ? (
              <Pressable style={styles.iconButton} onPress={onNotificationsPress} accessibilityRole="button">
                <Ionicons name="notifications-outline" size={22} color={colors.ink} />
                {notificationUnreadCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            ) : null}
          </>
        )}
      </View>
      <View style={styles.brand}>
        <Image
          source={require('../../assets/nav-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          {...(Platform.OS === 'android' ? { resizeMethod: 'resize' as const } : {})}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  headerStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: NAV_LOGO_WIDTH,
    height: NAV_LOGO_HEIGHT
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
    right: 4,
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
