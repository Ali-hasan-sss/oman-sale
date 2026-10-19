import type { ChatConversation, HeroBanner, HeroSlide, Listing } from '../types';

const listingById = new Map<string, Listing>();
let chatConversations: ChatConversation[] = [];

export function getCachedListing(id: string) {
  return listingById.get(id);
}

export function setCachedListing(id: string, listing: Listing) {
  listingById.set(id, listing);
}

export function getCachedChatConversations() {
  return chatConversations;
}

export function setCachedChatConversations(items: ChatConversation[]) {
  chatConversations = items;
}

let heroSlidesCache: HeroSlide[] = [];
let heroSlidesLocale: string | null = null;

export function getCachedHeroSlides(locale: string) {
  return heroSlidesLocale === locale ? heroSlidesCache : [];
}

export function isHeroSlidesLoaded(locale: string) {
  return heroSlidesLocale === locale;
}

export function setCachedHeroSlides(locale: string, slides: HeroSlide[]) {
  heroSlidesLocale = locale;
  heroSlidesCache = slides;
}

const heroBannersCache = new Map<string, HeroBanner[]>();

const heroBannersCacheKey = (locale: string, placement: string) => `${locale}:${placement}`;

export function getCachedHeroBanners(locale: string, placement = 'HOME_BELOW_HERO') {
  return heroBannersCache.get(heroBannersCacheKey(locale, placement)) ?? [];
}

export function isHeroBannersLoaded(locale: string, placement = 'HOME_BELOW_HERO') {
  return heroBannersCache.has(heroBannersCacheKey(locale, placement));
}

export function setCachedHeroBanners(locale: string, banners: HeroBanner[], placement = 'HOME_BELOW_HERO') {
  heroBannersCache.set(heroBannersCacheKey(locale, placement), banners);
}
