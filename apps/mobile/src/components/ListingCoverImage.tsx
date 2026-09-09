import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

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
  style?: StyleProp<ViewStyle | ImageStyle>;
};

export function ListingCoverImage({ uri, variant = 'card', style }: ListingCoverImageProps) {
  if (uri) {
    return (
      <Image source={{ uri }} style={[styles.media, style as StyleProp<ImageStyle>]} resizeMode="cover" />
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
  }
});
