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

let heroBannersCache: HeroBanner[] = [];
let heroBannersLocale: string | null = null;

export function getCachedHeroBanners(locale: string) {
  return heroBannersLocale === locale ? heroBannersCache : [];
}

export function isHeroBannersLoaded(locale: string) {
  return heroBannersLocale === locale;
}

export function setCachedHeroBanners(locale: string, banners: HeroBanner[]) {
  heroBannersLocale = locale;
  heroBannersCache = banners;
}
