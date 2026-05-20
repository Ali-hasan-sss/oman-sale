import { create } from 'zustand';

import { fallbackListings } from '../data';
import { hasMorePages } from '../lib/pagination';
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

export const LATEST_PAGE_SIZE = 8;
export const ALL_PAGE_SIZE = 12;

type ListingsState = {
  latest: Listing[];
  latestPage: number;
  latestHasMore: boolean;
  hasLoadedLatest: boolean;
  all: Listing[];
  allPage: number;
  allHasMore: boolean;
  hasLoadedAll: boolean;
  my: Listing[];
  hasLoadedMy: boolean;
  favorites: Listing[];
  hasLoadedFavorites: boolean;
  categories: CategoryOption[];
  hasLoadedCategories: boolean;
  isLoadingLatest: boolean;
  isLoadingMoreLatest: boolean;
  isRefreshingLatest: boolean;
  isLoadingAll: boolean;
  isLoadingMoreAll: boolean;
  isRefreshingAll: boolean;
  isLoadingMy: boolean;
  isRefreshingMy: boolean;
  isLoadingFavorites: boolean;
  isRefreshingFavorites: boolean;
  isLoadingCategories: boolean;
  isSubmittingListing: boolean;
  listingsError?: string;
  loadLatest: (options?: { refresh?: boolean }) => Promise<void>;
  loadMoreLatest: () => Promise<void>;
  loadAll: (options?: { refresh?: boolean }) => Promise<void>;
  loadMoreAll: () => Promise<void>;
  loadMy: (options?: { refresh?: boolean }) => Promise<void>;
  loadFavorites: (options?: { refresh?: boolean }) => Promise<void>;
  loadCategories: (locale: Locale, options?: { refresh?: boolean }) => Promise<void>;
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
  resetFavorites: () => void;
};

export const useListingsStore = create<ListingsState>((set, get) => ({
  latest: [],
  latestPage: 0,
  latestHasMore: true,
  hasLoadedLatest: false,
  all: [],
  allPage: 0,
  allHasMore: true,
  hasLoadedAll: false,
  my: [],
  hasLoadedMy: false,
  favorites: [],
  hasLoadedFavorites: false,
  categories: [],
  hasLoadedCategories: false,
  isLoadingLatest: false,
  isLoadingMoreLatest: false,
  isRefreshingLatest: false,
  isLoadingAll: false,
  isLoadingMoreAll: false,
  isRefreshingAll: false,
  isLoadingMy: false,
  isRefreshingMy: false,
  isLoadingFavorites: false,
  isRefreshingFavorites: false,
  isLoadingCategories: false,
  isSubmittingListing: false,
  listingsError: undefined,

  loadLatest: async (options) => {
    const refresh = options?.refresh ?? false;
    const showInitialLoader = !refresh && !get().hasLoadedLatest;
    set({
      isLoadingLatest: showInitialLoader,
      isRefreshingLatest: refresh,
      listingsError: undefined
    });
    try {
      const result = await fetchLatestListings(1, LATEST_PAGE_SIZE);
      const items = result.items.length > 0 ? result.items : fallbackListings;
      set({
        latest: items,
        latestPage: 1,
        latestHasMore: hasMorePages(items.length, result.items.length, LATEST_PAGE_SIZE, result.total),
        hasLoadedLatest: true
      });
    } catch {
      if (!get().hasLoadedLatest) {
        set({ latest: fallbackListings, latestPage: 0, latestHasMore: false, listingsError: 'latest' });
      }
    } finally {
      set({ isLoadingLatest: false, isRefreshingLatest: false });
    }
  },

  loadMoreLatest: async () => {
    const { latestHasMore, isLoadingMoreLatest, isLoadingLatest, latestPage, latest } = get();
    if (!latestHasMore || isLoadingMoreLatest || isLoadingLatest) return;

    set({ isLoadingMoreLatest: true, listingsError: undefined });
    try {
      const nextPage = latestPage + 1;
      const result = await fetchLatestListings(nextPage, LATEST_PAGE_SIZE);
      if (result.items.length === 0) {
        set({ latestHasMore: false });
        return;
      }
      const merged = [...latest, ...result.items];
      set({
        latest: merged,
        latestPage: nextPage,
        latestHasMore: hasMorePages(merged.length, result.items.length, LATEST_PAGE_SIZE, result.total)
      });
    } catch {
      set({ listingsError: 'latest' });
    } finally {
      set({ isLoadingMoreLatest: false });
    }
  },

  loadAll: async (options) => {
    const refresh = options?.refresh ?? false;
    const showInitialLoader = !refresh && !get().hasLoadedAll;
    set({
      isLoadingAll: showInitialLoader,
      isRefreshingAll: refresh,
      listingsError: undefined
    });
    try {
      const result = await fetchAllListings(1, ALL_PAGE_SIZE);
      const items = result.items.length > 0 ? result.items : fallbackListings;
      set({
        all: items,
        allPage: 1,
        allHasMore: hasMorePages(items.length, result.items.length, ALL_PAGE_SIZE, result.total),
        hasLoadedAll: true
      });
    } catch {
      if (!get().hasLoadedAll) {
        set({ all: fallbackListings, allPage: 0, allHasMore: false, listingsError: 'all' });
      }
    } finally {
      set({ isLoadingAll: false, isRefreshingAll: false });
    }
  },

  loadMoreAll: async () => {
    const { allHasMore, isLoadingMoreAll, isLoadingAll, allPage, all } = get();
    if (!allHasMore || isLoadingMoreAll || isLoadingAll) return;

    set({ isLoadingMoreAll: true, listingsError: undefined });
    try {
      const nextPage = allPage + 1;
      const result = await fetchAllListings(nextPage, ALL_PAGE_SIZE);
      if (result.items.length === 0) {
        set({ allHasMore: false });
        return;
      }
      const merged = [...all, ...result.items];
      set({
        all: merged,
        allPage: nextPage,
        allHasMore: hasMorePages(merged.length, result.items.length, ALL_PAGE_SIZE, result.total)
      });
    } catch {
      set({ listingsError: 'all' });
    } finally {
      set({ isLoadingMoreAll: false });
    }
  },

  loadMy: async (options) => {
    const refresh = options?.refresh ?? false;
    const showInitialLoader = !refresh && !get().hasLoadedMy;
    set({
      isLoadingMy: showInitialLoader,
      isRefreshingMy: refresh,
      listingsError: undefined
    });
    try {
      const result = await fetchMyListings();
      set({ my: result.items, hasLoadedMy: true });
    } catch {
      if (!get().hasLoadedMy) set({ my: [], listingsError: 'my' });
    } finally {
      set({ isLoadingMy: false, isRefreshingMy: false });
    }
  },

  loadFavorites: async (options) => {
    const refresh = options?.refresh ?? false;
    const showInitialLoader = !refresh && !get().hasLoadedFavorites;
    set({
      isLoadingFavorites: showInitialLoader,
      isRefreshingFavorites: refresh,
      listingsError: undefined
    });
    try {
      const items = await fetchFavoriteListings();
      set({ favorites: Array.isArray(items) ? items : [], hasLoadedFavorites: true });
    } catch {
      if (!get().hasLoadedFavorites) set({ favorites: [], listingsError: 'favorites' });
    } finally {
      set({ isLoadingFavorites: false, isRefreshingFavorites: false });
    }
  },

  loadCategories: async (locale, options) => {
    const refresh = options?.refresh ?? false;
    const showInitialLoader = !refresh && !get().hasLoadedCategories;
    set({
      isLoadingCategories: showInitialLoader,
      listingsError: undefined
    });
    try {
      const items = await fetchCategories(locale);
      set({ categories: Array.isArray(items) ? items : [], hasLoadedCategories: true });
    } catch {
      if (!get().hasLoadedCategories) set({ categories: [], listingsError: 'categories' });
    } finally {
      set({ isLoadingCategories: false });
    }
  },

  createListing: async (payload) => {
    set({ isSubmittingListing: true, listingsError: undefined });
    try {
      const result = await createListingRequest(payload);
      await get().loadMy({ refresh: true });
      return { ok: true, id: result.id };
    } catch {
      set({ listingsError: 'create' });
      return { ok: false, error: 'create' };
    } finally {
      set({ isSubmittingListing: false });
    }
  },

  resetMy: () => set({ my: [], hasLoadedMy: false }),
  resetFavorites: () => set({ favorites: [], hasLoadedFavorites: false })
}));
