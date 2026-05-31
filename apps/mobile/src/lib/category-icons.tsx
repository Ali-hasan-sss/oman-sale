import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import { AppText } from '../components/AppText';

/** Matches `categoryIconKeys` in apps/api/src/modules/categories/categories.validation.ts */
export const categoryIconKeys = [
  'baby',
  'bike',
  'book',
  'briefcase',
  'building',
  'car',
  'dumbbell',
  'gamepad',
  'graduation',
  'hammer',
  'heart',
  'home',
  'laptop',
  'map-pin',
  'monitor',
  'palette',
  'paw',
  'plane',
  'search',
  'shirt',
  'smartphone',
  'sofa',
  'store',
  'stethoscope',
  'tag',
  'truck',
  'utensils',
  'watch',
  'wrench'
] as const;

export type CategoryIconKey = (typeof categoryIconKeys)[number];

const iconNameMap: Record<CategoryIconKey, keyof typeof Ionicons.glyphMap> = {
  baby: 'balloon-outline',
  bike: 'bicycle-outline',
  book: 'book-outline',
  briefcase: 'briefcase-outline',
  building: 'business-outline',
  car: 'car-sport-outline',
  dumbbell: 'barbell-outline',
  gamepad: 'game-controller-outline',
  graduation: 'school-outline',
  hammer: 'hammer-outline',
  heart: 'heart-outline',
  home: 'home-outline',
  laptop: 'laptop-outline',
  'map-pin': 'location-outline',
  monitor: 'desktop-outline',
  palette: 'color-palette-outline',
  paw: 'paw-outline',
  plane: 'airplane-outline',
  search: 'search-outline',
  shirt: 'shirt-outline',
  smartphone: 'phone-portrait-outline',
  sofa: 'bed-outline',
  store: 'storefront-outline',
  stethoscope: 'medkit-outline',
  tag: 'pricetag-outline',
  truck: 'bus-outline',
  utensils: 'restaurant-outline',
  watch: 'watch-outline',
  wrench: 'construct-outline'
};

export const isCategoryIconKey = (value?: string | null): value is CategoryIconKey =>
  Boolean(value && categoryIconKeys.includes(value as CategoryIconKey));

export const isCategoryEmojiIcon = (value?: string | null) =>
  Boolean(value && !isCategoryIconKey(value) && /\p{Extended_Pictographic}/u.test(value));

type CategoryIconProps = {
  icon?: string | null;
  size?: number;
  color?: string;
};

export function CategoryIcon({ icon, size = 28, color = '#087a50' }: CategoryIconProps) {
  if (isCategoryEmojiIcon(icon)) {
    return <AppText style={[styles.emoji, { fontSize: size * 0.92, lineHeight: size * 1.05 }]}>{icon}</AppText>;
  }

  const name = isCategoryIconKey(icon) ? iconNameMap[icon] : 'apps-outline';
  return <Ionicons name={name} size={size} color={color} />;
}

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center'
  }
});
