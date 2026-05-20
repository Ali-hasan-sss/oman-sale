import { API_ENDPOINTS, http, type ApiEnvelope, type ApiListPage, type PagedResult } from '../lib/api';
import { normalizePage } from '../lib/pagination';
import { unwrapListItems } from '../lib/api/unwrap-list';
import type { Listing } from '../types';

export type CategoryOption = {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  icon?: string | null;
  parentId?: string | null;
  type: string;
  sortOrder?: number;
  _count?: {
    ads: number;
    children?: number;
  };
};

export type CategoryFilter = {
  id: string;
  title: string;
  options: Array<{
    id: string;
    label: string;
  }>;
};

export type ListingsFilterParams = {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  filterOptionIds?: string[];
};

export async function fetchLatestListings(page = 1, limit = 8) {
  const response = await http.get<ApiEnvelope<ApiListPage<Listing>>>(API_ENDPOINTS.ads.latest, {
    params: { page, limit }
  });
  return normalizePage(response.data.data, page, limit);
}

export async function fetchAllListings(page = 1, limit = 12) {
  return fetchFilteredListings({ page, limit });
}

export async function fetchFilteredListings({
  page = 1,
  limit = 12,
  q,
  categoryId,
  city,
  minPrice,
  maxPrice,
  filterOptionIds
}: ListingsFilterParams) {
  const response = await http.get<ApiEnvelope<ApiListPage<Listing>>>(API_ENDPOINTS.ads.all, {
    params: {
      page,
      limit,
      q: q || undefined,
      categoryId: categoryId || undefined,
      city: city || undefined,
      minPrice: minPrice !== undefined ? minPrice : undefined,
      maxPrice: maxPrice !== undefined ? maxPrice : undefined,
      filterOptionIds: filterOptionIds?.length ? filterOptionIds.join(',') : undefined
    }
  });
  return normalizePage(response.data.data, page, limit);
}

export async function fetchCategoryFilters(categoryId: string, locale: string) {
  const response = await http.get<ApiEnvelope<CategoryFilter[]>>(API_ENDPOINTS.categories.filters(categoryId), {
    params: { locale }
  });
  return Array.isArray(response.data.data) ? response.data.data : [];
}

export async function fetchFeaturedListings(page = 1, limit = 8) {
  const response = await http.get<ApiEnvelope<ApiListPage<Listing>>>(API_ENDPOINTS.ads.featured, {
    params: { page, limit }
  });
  return normalizePage(response.data.data, page, limit);
}

export async function fetchMyListings(page = 1, limit = 20) {
  const response = await http.get<ApiEnvelope<ApiListPage<Listing>>>(API_ENDPOINTS.ads.my, {
    params: { page, limit }
  });
  return normalizePage(response.data.data, page, limit);
}

export async function fetchFavoriteListings() {
  const response = await http.get<ApiEnvelope<ApiListPage<Listing> | Listing[]>>(API_ENDPOINTS.ads.favorites);
  return unwrapListItems(response.data.data);
}

export async function fetchListingById(id: string) {
  const response = await http.get<ApiEnvelope<Listing>>(API_ENDPOINTS.ads.byId(id));
  return response.data.data;
}

export async function fetchSimilarListings(id: string) {
  const response = await http.get<ApiEnvelope<Listing[]>>(API_ENDPOINTS.ads.similar(id));
  return response.data.data;
}

export async function fetchFavoriteIds() {
  const response = await http.get<ApiEnvelope<string[]>>(API_ENDPOINTS.ads.favoriteIds);
  return response.data.data;
}

export async function fetchCategories(locale: string) {
  const response = await http.get<ApiEnvelope<CategoryOption[] | ApiListPage<CategoryOption>>>(
    API_ENDPOINTS.categories.list,
    {
      params: { locale }
    }
  );
  return unwrapListItems(response.data.data);
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
