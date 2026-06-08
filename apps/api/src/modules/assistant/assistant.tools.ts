import { adsService } from '../ads/ads.service';
import {
  ASSISTANT_LISTINGS_LIMIT,
  searchListingsFlexible
} from './assistant-search';
import { buildListingsBrowsePath, buildStoresBrowsePath } from './assistant-browse';
import { searchStoresFlexible } from './assistant-store-search';
import type { AssistantAuthContext } from './assistant-auth-actions';
import type { AssistantLocale } from './assistant.validation';
import type {
  AssistantAction,
  AssistantListingCard,
  AssistantStoreCard,
  SearchListingsToolArgs,
  SearchStoresToolArgs
} from './assistant.types';

function mapListing(ad: {
  id: string;
  title: string;
  price: unknown;
  currency: string;
  city: string | null;
  wilayah?: string | null;
  area?: string | null;
  images?: Array<{ imageUrl: string }>;
  promotion?: { plan?: { badgeLabel?: string | null } | null } | null;
  category?: { nameAr?: string; nameEn?: string; name?: string | null } | null;
}): AssistantListingCard {
  const price =
    ad.price === null || ad.price === undefined
      ? null
      : typeof ad.price === 'number'
        ? ad.price
        : Number(ad.price);

  return {
    id: ad.id,
    title: ad.title,
    price: Number.isFinite(price) ? price : null,
    currency: ad.currency,
    city: ad.city ?? '',
    wilayah: ad.wilayah,
    area: ad.area,
    imageUrl: ad.images?.[0]?.imageUrl ?? null,
    isFeatured: Boolean(ad.promotion),
    badgeLabel: ad.promotion?.plan?.badgeLabel ?? null,
    categoryName: ad.category?.nameAr ?? ad.category?.nameEn ?? ad.category?.name ?? null
  };
}

function mapStore(
  store: {
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
    bioAr: string;
    bioEn: string;
    logoUrl?: string | null;
    coverUrl?: string | null;
    phone?: string | null;
    city?: string | null;
    _count: { ads: number };
    rootCategory?: { nameAr?: string; nameEn?: string } | null;
    storeType?: { nameAr?: string; nameEn?: string } | null;
  },
  locale: AssistantLocale
): AssistantStoreCard {
  return {
    id: store.id,
    slug: store.slug,
    name: locale === 'ar' ? store.nameAr : store.nameEn,
    bio: locale === 'ar' ? store.bioAr : store.bioEn,
    city: store.city ?? '',
    logoUrl: store.logoUrl,
    coverUrl: store.coverUrl,
    phone: store.phone,
    listingsCount: store._count.ads,
    storeTypeName: locale === 'ar' ? store.storeType?.nameAr : store.storeType?.nameEn,
    categoryName: locale === 'ar' ? store.rootCategory?.nameAr : store.rootCategory?.nameEn
  };
}

export async function executeSearchStores(
  args: SearchStoresToolArgs,
  userMessage: string | undefined,
  locale: AssistantLocale
): Promise<{ stores: AssistantStoreCard[]; isFallback: boolean; actions: AssistantAction[] }> {
  const meta = await searchStoresFlexible(args, userMessage);
  const viewAllLabel = locale === 'ar' ? 'رؤية كافة المتاجر' : 'View all stores';
  const actions: AssistantAction[] = [];

  if (meta.browseQuery || meta.storeTypeId || meta.city || meta.items.length > 0) {
    actions.push({
      label: viewAllLabel,
      href: buildStoresBrowsePath(locale, {
        q: meta.browseQuery || undefined,
        storeTypeId: meta.storeTypeId,
        city: meta.city
      }),
      variant: 'primary'
    });
  }

  return {
    stores: meta.items.map((store) => mapStore(store, locale)),
    isFallback: meta.isFallback,
    actions
  };
}

export async function executeSearchListings(
  args: SearchListingsToolArgs,
  userMessage: string | undefined,
  locale: AssistantLocale
): Promise<{ listings: AssistantListingCard[]; isFallback: boolean; actions: AssistantAction[] }> {
  const meta = await searchListingsFlexible(args, userMessage);
  const viewAllLabel = locale === 'ar' ? 'رؤية كافة العروض' : 'View all listings';
  const actions: AssistantAction[] = [];

  if (meta.browseQuery || meta.categorySlug || meta.items.length > 0) {
    actions.push({
      label: viewAllLabel,
      href: buildListingsBrowsePath(locale, {
        categorySlug: meta.categorySlug,
        q: meta.browseQuery || undefined,
        minPrice: meta.minPrice,
        maxPrice: meta.maxPrice,
        city: meta.city
      }),
      variant: 'primary'
    });
  }

  return {
    listings: meta.items.map(mapListing),
    isFallback: meta.isFallback,
    actions
  };
}

export async function executeFeaturedListings(
  auth: AssistantAuthContext,
  limit = ASSISTANT_LISTINGS_LIMIT
): Promise<{
  summary: string;
  listings: AssistantListingCard[];
  actions: AssistantAction[];
}> {
  const result = await adsService.listFeatured({ page: 1, limit, filterOptionIds: [] });
  const summary =
    auth.locale === 'ar'
      ? 'إليك بعض العروض المميزة الحالية على المنصة:'
      : 'Here are some featured listings on the platform:';

  return {
    summary,
    listings: result.items.map(mapListing),
    actions: [
      {
        label: auth.locale === 'ar' ? 'جميع الإعلانات' : 'All listings',
        href: `/${auth.locale}/all-listings`,
        variant: 'default'
      }
    ]
  };
}
