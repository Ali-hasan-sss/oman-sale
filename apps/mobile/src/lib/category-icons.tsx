import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet } from 'react-native';

import { AppText } from '../components/AppText';

/** Matches `categoryIconKeys` in apps/api/src/modules/categories/categories.validation.ts */
export const categoryIconKeys = [
  'anchor',
  'baby',
  'bag',
  'bike',
  'book',
  'box',
  'briefcase',
  'brush',
  'building',
  'calculator',
  'camera',
  'car',
  'cart',
  'coffee',
  'compass',
  'cog',
  'crown',
  'dumbbell',
  'fish',
  'flower',
  'gamepad',
  'gavel',
  'gem',
  'gift',
  'globe',
  'graduation',
  'hammer',
  'hardhat',
  'headphones',
  'heart',
  'home',
  'key',
  'laptop',
  'lightbulb',
  'map-pin',
  'megaphone',
  'mic',
  'money',
  'monitor',
  'music',
  'package',
  'palette',
  'paw',
  'pen',
  'pill',
  'plane',
  'printer',
  'recycle',
  'scissors',
  'search',
  'shield',
  'ship',
  'shirt',
  'smartphone',
  'sofa',
  'sparkles',
  'star',
  'store',
  'stethoscope',
  'sun',
  'tag',
  'tent',
  'ticket',
  'tree',
  'trophy',
  'truck',
  'tv',
  'users',
  'utensils',
  'video',
  'watch',
  'wifi',
  'wrench',
  'zap'
] as const;

export type CategoryIconKey = (typeof categoryIconKeys)[number];

const iconNameMap: Record<CategoryIconKey, keyof typeof Ionicons.glyphMap> = {
  anchor: 'anchor-outline',
  baby: 'balloon-outline',
  bag: 'bag-outline',
  bike: 'bicycle-outline',
  book: 'book-outline',
  box: 'cube-outline',
  briefcase: 'briefcase-outline',
  brush: 'brush-outline',
  building: 'business-outline',
  calculator: 'calculator-outline',
  camera: 'camera-outline',
  car: 'car-sport-outline',
  cart: 'cart-outline',
  coffee: 'cafe-outline',
  compass: 'compass-outline',
  cog: 'settings-outline',
  crown: 'ribbon-outline',
  dumbbell: 'barbell-outline',
  fish: 'fish-outline',
  flower: 'flower-outline',
  gamepad: 'game-controller-outline',
  gavel: 'document-text-outline',
  gem: 'diamond-outline',
  gift: 'gift-outline',
  globe: 'globe-outline',
  graduation: 'school-outline',
  hammer: 'hammer-outline',
  hardhat: 'hard-hat-outline',
  headphones: 'headset-outline',
  heart: 'heart-outline',
  home: 'home-outline',
  key: 'key-outline',
  laptop: 'laptop-outline',
  lightbulb: 'bulb-outline',
  'map-pin': 'location-outline',
  megaphone: 'megaphone-outline',
  mic: 'mic-outline',
  money: 'cash-outline',
  monitor: 'desktop-outline',
  music: 'musical-notes-outline',
  package: 'cube-outline',
  palette: 'color-palette-outline',
  paw: 'paw-outline',
  pen: 'pencil-outline',
  pill: 'medical-outline',
  plane: 'airplane-outline',
  printer: 'print-outline',
  recycle: 'refresh-outline',
  scissors: 'cut-outline',
  search: 'search-outline',
  shield: 'shield-outline',
  ship: 'boat-outline',
  shirt: 'shirt-outline',
  smartphone: 'phone-portrait-outline',
  sofa: 'bed-outline',
  sparkles: 'sparkles-outline',
  star: 'star-outline',
  store: 'storefront-outline',
  stethoscope: 'medkit-outline',
  sun: 'sunny-outline',
  tag: 'pricetag-outline',
  tent: 'bonfire-outline',
  ticket: 'ticket-outline',
  tree: 'leaf-outline',
  trophy: 'trophy-outline',
  truck: 'bus-outline',
  tv: 'tv-outline',
  users: 'people-outline',
  utensils: 'restaurant-outline',
  video: 'videocam-outline',
  watch: 'watch-outline',
  wifi: 'wifi-outline',
  wrench: 'construct-outline',
  zap: 'flash-outline'
};

export const isCategoryIconKey = (value?: string | null): value is CategoryIconKey =>
  Boolean(value && categoryIconKeys.includes(value as CategoryIconKey));

export const isCategoryEmojiIcon = (value?: string | null) =>
  Boolean(value && !isCategoryIconKey(value) && /\p{Extended_Pictographic}/u.test(value));

type CategoryIconProps = {
  icon?: string | null;
  iconImageUrl?: string | null;
  size?: number;
  color?: string;
};

export function CategoryIcon({ icon, iconImageUrl, size = 28, color = '#087a50' }: CategoryIconProps) {
  if (iconImageUrl) {
    return (
      <Image
        source={{ uri: iconImageUrl }}
        style={{ width: size, height: size, borderRadius: size * 0.15 }}
        resizeMode="cover"
      />
    );
  }

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
