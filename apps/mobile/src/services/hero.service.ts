import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import type { HeroBanner, HeroSlide, Locale } from '../types';

export async function fetchHeroBanners(locale: Locale) {
  const response = await http.get<ApiEnvelope<HeroBanner[]>>(API_ENDPOINTS.hero.banners, {
    params: { locale }
  });
  return response.data.data;
}

export async function fetchHeroSlides(locale: Locale, platform: 'web' | 'mobile') {
  const response = await http.get<ApiEnvelope<HeroSlide[]>>(API_ENDPOINTS.hero.slides, {
    params: { locale, platform }
  });
  return response.data.data;
}
