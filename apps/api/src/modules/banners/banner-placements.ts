import { BannerPlacement } from '@prisma/client';
import { z } from 'zod';

export const DEFAULT_BANNER_PLACEMENT = BannerPlacement.HOME_BELOW_HERO;

export const bannerPlacementSchema = z.nativeEnum(BannerPlacement);

export const bannerPlacementLabels: Record<BannerPlacement, { ar: string; en: string }> = {
  HOME_BELOW_HERO: { ar: 'بنر الرئيسية الأول', en: 'Homepage banner 1' },
  HOME_BELOW_CATEGORIES: { ar: 'بنر الرئيسية الثاني', en: 'Homepage banner 2' },
  HOME_BELOW_ARTICLES: { ar: 'بنر الرئيسية الثالث', en: 'Homepage banner 3' },
  CATEGORIES: { ar: 'صفحة الفئات', en: 'Categories page' },
  OFFERS: { ar: 'صفحة العروض', en: 'Offers page' },
  ARTICLES: { ar: 'صفحة المقالات', en: 'Articles page' },
  ARTICLE: { ar: 'صفحة المقال', en: 'Article page' },
  TOURISM: { ar: 'صفحة السياحة', en: 'Tourism page' },
  DESTINATION: { ar: 'صفحة الوجهة', en: 'Destination page' },
  STORES: { ar: 'صفحة المتاجر', en: 'Stores page' },
  STORE: { ar: 'صفحة المتجر', en: 'Store page' },
  SEARCH: { ar: 'صفحة البحث', en: 'Search page' },
  LISTING: { ar: 'صفحة العرض', en: 'Listing page' },
  RAFFLE: { ar: 'صفحة السحب', en: 'Raffle page' },
  PRICING: { ar: 'صفحة الأسعار', en: 'Pricing page' }
};

export function resolveBannerPlacement(value: unknown): BannerPlacement {
  const parsed = bannerPlacementSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_BANNER_PLACEMENT;
}
