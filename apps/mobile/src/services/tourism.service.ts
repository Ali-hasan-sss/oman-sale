import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import { resolveDeviceMediaUrl } from '../lib/media-url';

export type TourismDestination = {
  id: string;
  slug: string;
  imageUrl: string;
  galleryImages?: string[];
  titleAr: string;
  titleEn: string;
  rating: string;
  ratingLabelAr: string;
  ratingLabelEn: string;
  aboutAr?: string;
  aboutEn?: string;
  highlightsAr?: string[];
  highlightsEn?: string[];
  activitiesAr?: string[];
  activitiesEn?: string[];
  bestTimeAr: string;
  bestTimeEn: string;
  addressAr: string;
  addressEn: string;
};

function withDeviceMedia(destination: TourismDestination): TourismDestination {
  return {
    ...destination,
    imageUrl: resolveDeviceMediaUrl(destination.imageUrl),
    galleryImages: (destination.galleryImages ?? []).map((image) => resolveDeviceMediaUrl(image)).filter(Boolean)
  };
}

export async function fetchTourismDestinations() {
  const response = await http.get<ApiEnvelope<TourismDestination[]>>(API_ENDPOINTS.tourism.destinations);
  const items = Array.isArray(response.data.data) ? response.data.data : [];
  return items.map(withDeviceMedia);
}

export async function fetchTourismDestination(idOrSlug: string) {
  const response = await http.get<ApiEnvelope<TourismDestination>>(API_ENDPOINTS.tourism.destination(idOrSlug));
  return withDeviceMedia(response.data.data);
}
