import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View, type ImageSourcePropType, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { resolveDeviceMediaUrl } from '../lib/media-url';
import { colors } from '../theme';

export type ListingCoverVariant = 'card' | 'cardHorizontal' | 'thumb' | 'hero';

const ICON_SIZE: Record<ListingCoverVariant, number> = {
  card: 40,
  cardHorizontal: 36,
  thumb: 18,
  hero: 56
};

type ListingCoverImageProps = {
  uri?: string | null;
  variant?: ListingCoverVariant;
  fallbackSource?: ImageSourcePropType;
  style?: StyleProp<ViewStyle | ImageStyle>;
};

export function ListingCoverImage({ uri, variant = 'card', fallbackSource, style }: ListingCoverImageProps) {
  const resolved = resolveDeviceMediaUrl(uri);
  if (resolved) {
    return (
      <Image source={{ uri: resolved }} style={[styles.media, style as StyleProp<ImageStyle>]} resizeMode="cover" />
    );
  }

  if (fallbackSource) {
    return (
      <View style={[styles.placeholder, style]}>
        <Image source={fallbackSource} style={styles.fallbackLogo} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={[styles.placeholder, style]}>
      <Ionicons name="image-outline" size={ICON_SIZE[variant]} color={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.brandSoft
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft
  },
  fallbackLogo: {
    width: '72%',
    height: '72%'
  }
});
