import { API_ENDPOINTS, http, type ApiEnvelope, type ApiListPage } from '../lib/api';
import type { Listing } from '../types';

export type CategoryOption = {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  type: string;
};

export async function fetchLatestListings(limit = 8) {
  const response = await http.get<ApiEnvelope<ApiListPage<Listing>>>(API_ENDPOINTS.ads.latest, {
    params: { limit }
  });
  return response.data.data.items;
}

export async function fetchAllListings(limit = 30) {
  const response = await http.get<ApiEnvelope<ApiListPage<Listing>>>(API_ENDPOINTS.ads.all, {
    params: { limit }
  });
  return response.data.data.items;
}

export async function fetchFeaturedListings(limit = 8) {
  const response = await http.get<ApiEnvelope<ApiListPage<Listing>>>(API_ENDPOINTS.ads.featured, {
    params: { limit }
  });
  return response.data.data.items;
}

export async function fetchMyListings(limit = 40) {
  const response = await http.get<ApiEnvelope<ApiListPage<Listing>>>(API_ENDPOINTS.ads.my, {
    params: { limit }
  });
  return response.data.data.items;
}

export async function fetchFavoriteListings() {
  const response = await http.get<ApiEnvelope<ApiListPage<Listing>>>(API_ENDPOINTS.ads.favorites);
  return response.data.data.items;
}

export async function fetchCategories(locale: string) {
  const response = await http.get<ApiEnvelope<CategoryOption[]>>(API_ENDPOINTS.categories.list, {
    params: { locale }
  });
  return response.data.data;
}

export async function createListingRequest(payload: {
  title: string;
  description: string;
  type: string;
  price: number;
  city: string;
  categoryId: string;
  imageUrls: string[];
}) {
  const response = await http.post<ApiEnvelope<{ id: string }>>(API_ENDPOINTS.ads.root, {
    ...payload,
    currency: 'OMR',
    imageUrls: payload.imageUrls
  });
  return response.data.data;
}

export async function toggleFavoriteRequest(listingId: string) {
  await http.post(API_ENDPOINTS.ads.favorite(listingId));
}

export async function removeFavoriteRequest(listingId: string) {
  await http.delete(API_ENDPOINTS.ads.favorite(listingId));
}
