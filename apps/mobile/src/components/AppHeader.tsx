import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useI18n } from '../i18n';
import { colors } from '../theme';

/** Matches `assets/nav-logo.png` (92×104 @1x). */
const NAV_LOGO_WIDTH = 46;
const NAV_LOGO_HEIGHT = 52;

type AppHeaderProps = {
  onMenuPress: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
};

export function AppHeader({ onMenuPress, showBack, onBackPress }: AppHeaderProps) {
  const { isRtl } = useI18n();

  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable style={styles.menuButton} onPress={onBackPress}>
          <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.ink} />
        </Pressable>
      ) : (
        <Pressable style={styles.menuButton} onPress={onMenuPress}>
          <Ionicons name="menu" size={24} color={colors.ink} />
        </Pressable>
      )}
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
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  }
});
