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
  | 'favorites'
  | 'listingDetail'
  | 'chatConversation'
  | 'categoryOffers';

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
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
  createdAt?: string;
  contactPhone?: string | null;
  isSold?: boolean;
  isActive?: boolean;
  images?: Array<{ imageUrl: string }>;
  category?: {
    name?: string;
    nameAr?: string;
    nameEn?: string;
  } | null;
  user?: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string | null;
    avatar?: string | null;
    createdAt?: string;
  } | null;
  promotion?: {
    plan?: {
      badgeLabel?: string | null;
    } | null;
  } | null;
};

export type ChatAd = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  area?: string | null;
  images?: Array<{ imageUrl: string }>;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
};

export type ChatConversation = {
  id: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  unreadCount?: number;
  ad: ChatAd;
  participants: Array<{
    userId: string;
    user: User;
  }>;
  messages: ChatMessage[];
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
