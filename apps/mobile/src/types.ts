export type Locale = 'ar' | 'en';

export type ScreenName =
  | 'home'
  | 'offers'
  | 'myOffers'
  | 'addOffer'
  | 'chat'
  | 'login'
  | 'register'
  | 'profile'
  | 'settings'
  | 'favorites';

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role?: string;
  avatar?: string | null;
};

export type AuthSession = {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

export type Listing = {
  id: string;
  title: string;
  description?: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  area?: string | null;
  views?: number;
  images?: Array<{ imageUrl: string }>;
  category?: {
    name?: string;
    nameAr?: string;
    nameEn?: string;
  } | null;
  promotion?: {
    plan?: {
      badgeLabel?: string | null;
    } | null;
  } | null;
};

export type Conversation = {
  id: string;
  adTitle: string;
  sellerName: string;
  lastMessage: string;
  updatedAt: string;
  unread?: boolean;
};

export type HeroBanner = {
  id: string;
  sortOrder: number;
  imageUrl: string;
  text?: string | null;
  linkUrl: string;
};

export type HeroSlide = {
  id: string;
  sortOrder: number;
  platform?: 'WEB' | 'MOBILE';
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonLink: string;
};
