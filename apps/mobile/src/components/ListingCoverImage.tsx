import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle
} from 'react-native';

import { colors } from '../theme';

const listingLogo = require('../../assets/splash-logo.png');

export type ListingCoverVariant = 'card' | 'cardHorizontal' | 'thumb' | 'hero';

const LOGO_SIZE: Record<ListingCoverVariant, { width: number; height: number }> = {
  card: { width: 132, height: 88 },
  cardHorizontal: { width: 108, height: 72 },
  thumb: { width: 40, height: 40 },
  hero: { width: 200, height: 120 }
};

const PLACEHOLDER_PADDING: Record<ListingCoverVariant, number> = {
  card: 20,
  cardHorizontal: 16,
  thumb: 6,
  hero: 28
};

type ListingCoverImageProps = {
  uri?: string | null;
  variant?: ListingCoverVariant;
  style?: StyleProp<ViewStyle | ImageStyle>;
};

export function ListingCoverImage({ uri, variant = 'card', style }: ListingCoverImageProps) {
  if (uri) {
    return (
      <Image source={{ uri }} style={[styles.media, style as StyleProp<ImageStyle>]} resizeMode="cover" />
    );
  }

  const logoSize = LOGO_SIZE[variant];

  return (
    <View style={[styles.placeholder, { padding: PLACEHOLDER_PADDING[variant] }, style]}>
      <Image source={listingLogo} style={[styles.logo, logoSize]} resizeMode="contain" />
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
    backgroundColor: 'transparent'
  },
  logo: {
    maxWidth: '100%',
    maxHeight: '100%'
  }
});
