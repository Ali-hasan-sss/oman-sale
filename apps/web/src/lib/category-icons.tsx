import {
  Baby,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Car,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Hammer,
  Heart,
  Home,
  Laptop,
  MapPin,
  Monitor,
  Palette,
  PawPrint,
  Plane,
  Search,
  Shirt,
  Smartphone,
  Sofa,
  Store,
  Stethoscope,
  Tag,
  Truck,
  Utensils,
  Watch,
  Wrench
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

export const categoryIconMap: Record<CategoryIconKey, LucideIcon> = {
  baby: Baby,
  bike: Bike,
  book: BookOpen,
  briefcase: Briefcase,
  building: Building2,
  car: Car,
  dumbbell: Dumbbell,
  gamepad: Gamepad2,
  graduation: GraduationCap,
  hammer: Hammer,
  heart: Heart,
  home: Home,
  laptop: Laptop,
  'map-pin': MapPin,
  monitor: Monitor,
  palette: Palette,
  paw: PawPrint,
  plane: Plane,
  search: Search,
  shirt: Shirt,
  smartphone: Smartphone,
  sofa: Sofa,
  store: Store,
  stethoscope: Stethoscope,
  tag: Tag,
  truck: Truck,
  utensils: Utensils,
  watch: Watch,
  wrench: Wrench
};

export const isCategoryIconKey = (value?: string | null): value is CategoryIconKey =>
  Boolean(value && categoryIconKeys.includes(value as CategoryIconKey));

export const isCategoryEmojiIcon = (value?: string | null) =>
  Boolean(value && !isCategoryIconKey(value) && /\p{Extended_Pictographic}/u.test(value));

type CategoryIconProps = {
  icon?: string | null;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export function CategoryIcon({ icon, size = 40, className, strokeWidth = 1.5 }: CategoryIconProps) {
  if (isCategoryEmojiIcon(icon)) {
    return (
      <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1 }}>
        {icon}
      </span>
    );
  }

  const Icon = isCategoryIconKey(icon) ? categoryIconMap[icon] : Tag;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}
