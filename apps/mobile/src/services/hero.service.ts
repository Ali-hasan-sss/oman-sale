import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import type { HeroBanner, HeroSlide, Locale } from '../types';

export async function fetchHeroBanners(locale: Locale, placement = 'HOME_BELOW_HERO') {
  const response = await http.get<ApiEnvelope<HeroBanner[]>>(API_ENDPOINTS.hero.banners, {
    params: { locale, placement }
  });
  return response.data.data;
}

export async function fetchBannerPublicCopy(placement = 'HOME_BELOW_HERO') {
  const response = await http.get<
    ApiEnvelope<{
      titleAr?: string | null;
      titleEn?: string | null;
      subtitleAr?: string | null;
      subtitleEn?: string | null;
    }>
  >(API_ENDPOINTS.bannerRequests.pricing, { params: { placement } });
  return response.data.data;
}

export async function fetchHeroSlides(locale: Locale, platform: 'web' | 'mobile') {
  const response = await http.get<ApiEnvelope<HeroSlide[]>>(API_ENDPOINTS.hero.slides, {
    params: { locale, platform }
  });
  return response.data.data;
}
