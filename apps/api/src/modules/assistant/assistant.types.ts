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

export type AssistantChatResult = {
  reply: string;
  listings: AssistantListingCard[];
  stores: AssistantStoreCard[];
  actions: AssistantAction[];
};

export type SearchListingsToolArgs = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  limit?: number;
};

export type SearchStoresToolArgs = {
  q?: string;
  city?: string;
  storeTypeSlug?: string;
  limit?: number;
};

export type PlatformInfoTopic =
  | 'pricing_overview'
  | 'store_plans'
  | 'promotion_plans'
  | 'platform_overview'
  | 'contact'
  | 'create_store'
  | 'promote_listing'
  | 'post_ad'
  | 'chat_messaging'
  | 'favorites'
  | 'banner_ads'
  | 'payments'
  | 'featured_listings';

export type GetPlatformInfoToolArgs = {
  topic: PlatformInfoTopic;
  planName?: string;
};
