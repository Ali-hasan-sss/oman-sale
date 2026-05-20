import { create } from 'zustand';

import { fallbackListings } from '../data';
import type { CategoryOption } from '../services/listings.service';
import {
  createListingRequest,
  fetchAllListings,
  fetchCategories,
  fetchFavoriteListings,
  fetchLatestListings,
  fetchMyListings
} from '../services/listings.service';
import type { Listing, Locale } from '../types';

type ListingsState = {
  latest: Listing[];
  all: Listing[];
  my: Listing[];
  favorites: Listing[];
  categories: CategoryOption[];
  isLoadingLatest: boolean;
  isLoadingAll: boolean;
  isLoadingMy: boolean;
  isLoadingFavorites: boolean;
  isLoadingCategories: boolean;
  isSubmittingListing: boolean;
  listingsError?: string;
  loadLatest: (limit?: number) => Promise<void>;
  loadAll: (limit?: number) => Promise<void>;
  loadMy: () => Promise<void>;
  loadFavorites: () => Promise<void>;
  loadCategories: (locale: Locale) => Promise<void>;
  createListing: (payload: {
    title: string;
    description: string;
    type: string;
    price: number;
    city: string;
    categoryId: string;
    imageUrls: string[];
  }) => Promise<{ ok: true; id: string } | { ok: false; error: string }>;
  resetMy: () => void;
};

export const useListingsStore = create<ListingsState>((set, get) => ({
  latest: fallbackListings,
  all: [],
  my: [],
  favorites: [],
  categories: [],
  isLoadingLatest: false,
  isLoadingAll: false,
  isLoadingMy: false,
  isLoadingFavorites: false,
  isLoadingCategories: false,
  isSubmittingListing: false,
  listingsError: undefined,

  loadLatest: async (limit = 8) => {
    set({ isLoadingLatest: true, listingsError: undefined });
    try {
      const items = await fetchLatestListings(limit);
      set({ latest: items.length > 0 ? items : fallbackListings });
    } catch {
      set({ latest: fallbackListings, listingsError: 'latest' });
    } finally {
      set({ isLoadingLatest: false });
    }
  },

  loadAll: async (limit = 40) => {
    set({ isLoadingAll: true, listingsError: undefined });
    try {
      const items = await fetchAllListings(limit);
      set({ all: items.length > 0 ? items : fallbackListings });
    } catch {
      set({ all: fallbackListings, listingsError: 'all' });
    } finally {
      set({ isLoadingAll: false });
    }
  },

  loadMy: async () => {
    set({ isLoadingMy: true, listingsError: undefined });
    try {
      const items = await fetchMyListings();
      set({ my: items });
    } catch {
      set({ my: [], listingsError: 'my' });
    } finally {
      set({ isLoadingMy: false });
    }
  },

  loadFavorites: async () => {
    set({ isLoadingFavorites: true, listingsError: undefined });
    try {
      const items = await fetchFavoriteListings();
      set({ favorites: items });
    } catch {
      set({ favorites: [], listingsError: 'favorites' });
    } finally {
      set({ isLoadingFavorites: false });
    }
  },

  loadCategories: async (locale) => {
    set({ isLoadingCategories: true, listingsError: undefined });
    try {
      const items = await fetchCategories(locale);
      set({ categories: items });
    } catch {
      set({ categories: [], listingsError: 'categories' });
    } finally {
      set({ isLoadingCategories: false });
    }
  },

  createListing: async (payload) => {
    set({ isSubmittingListing: true, listingsError: undefined });
    try {
      const result = await createListingRequest(payload);
      await get().loadMy();
      return { ok: true, id: result.id };
    } catch {
      set({ listingsError: 'create' });
      return { ok: false, error: 'create' };
    } finally {
      set({ isSubmittingListing: false });
    }
  },

  resetMy: () => set({ my: [] })
}));
