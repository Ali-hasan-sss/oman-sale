import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { colors } from '../theme';

type AvatarWithBanBadgeProps = {
  uri?: string | null;
  fallbackLabel?: string;
  size?: number;
  isBlocked?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  badgeLabel?: string;
};

export function AvatarWithBanBadge({
  uri,
  fallbackLabel,
  size = 56,
  isBlocked = false,
  style,
  imageStyle,
  badgeLabel
}: AvatarWithBanBadgeProps) {
  const radius = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: radius }, imageStyle]} />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: radius }]}>
          {fallbackLabel ? <AppText style={styles.fallbackText}>{fallbackLabel.slice(0, 1).toUpperCase()}</AppText> : null}
          {!fallbackLabel ? <Ionicons name="person" size={size * 0.45} color="#fff" /> : null}
        </View>
      )}

      {isBlocked ? (
        <View style={[styles.badge, { width: size * 0.38, height: size * 0.38, borderRadius: size * 0.19 }]}>
          <Ionicons name="ban" size={size * 0.18} color="#fff" />
        </View>
      ) : null}

      {isBlocked && badgeLabel ? (
        <View style={styles.banner}>
          <AppText style={styles.bannerText} numberOfLines={1}>
            {badgeLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'visible'
  },
  image: {
    backgroundColor: colors.brandSoft
  },
  fallback: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fallbackText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 22
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface
  },
  banner: {
    position: 'absolute',
    bottom: -10,
    left: -8,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  bannerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center'
  }
});
