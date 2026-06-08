export type AssistantAction = {
  label: string;
  href: string;
  variant?: 'primary' | 'default';
};

export type AssistantListingCard = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  city: string;
  wilayah?: string | null;
  area?: string | null;
  imageUrl?: string | null;
  isFeatured: boolean;
  badgeLabel?: string | null;
  categoryName?: string | null;
};

export type AssistantStoreCard = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  city: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  listingsCount: number;
  storeTypeName?: string | null;
  categoryName?: string | null;
};

export type QuickReplyIntent =
  | 'pricing_overview'
  | 'search_car_showrooms'
  | 'featured_listings'
  | 'create_store'
  | 'promote_listing'
  | 'post_ad'
  | 'browse_stores'
  | 'contact';

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  listings?: AssistantListingCard[];
  stores?: AssistantStoreCard[];
  actions?: AssistantAction[];
};

export type AssistantChatResult = {
  reply: string;
  listings: AssistantListingCard[];
  stores: AssistantStoreCard[];
  actions: AssistantAction[];
};
