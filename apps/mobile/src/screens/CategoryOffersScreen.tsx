import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollView as ScrollViewType
} from 'react-native';

import { AppText } from '../components/AppText';
import {
  CategoryFiltersPanel,
  type CategoryFiltersDraft
} from '../components/CategoryFiltersPanel';
import { EmptyState } from '../components/EmptyState';
import { ListingCard } from '../components/ListingCard';
import { ListingListSkeleton } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { hasMorePages } from '../lib/pagination';
import {
  fetchCategoryFilters,
  fetchFilteredListings,
  type CategoryFilter
} from '../services/listings.service';
import { useListingsStore } from '../stores';
import { colors, radius } from '../theme';
import type { Listing } from '../types';

const PAGE_SIZE = 12;

type AppliedFilters = {
  search: string;
  categoryId: string;
  city: string;
  minPrice?: number;
  maxPrice?: number;
  filterOptionIds: string[];
};

type CategoryOffersScreenProps = {
  categoryId: string;
  onListingPress: (listingId: string) => void;
};

const emptyDraft = (): CategoryFiltersDraft => ({
  search: '',
  subcategoryId: '',
  city: '',
  minPrice: '',
  maxPrice: '',
  filterOptionIds: []
});

const parsePrice = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
};

const countActiveFilters = (applied: AppliedFilters, rootCategoryId: string) => {
  let count = 0;
  if (applied.search.trim()) count += 1;
  if (applied.categoryId && applied.categoryId !== rootCategoryId) count += 1;
  if (applied.city) count += 1;
  if (applied.minPrice !== undefined) count += 1;
  if (applied.maxPrice !== undefined) count += 1;
  count += applied.filterOptionIds.length;
  return count;
};

export function CategoryOffersScreen({ categoryId, onListingPress }: CategoryOffersScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const categories = useListingsStore((state) => state.categories);
  const loadCategories = useListingsStore((state) => state.loadCategories);

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [sort, setSort] = useState<'recent' | 'price-low' | 'price-high' | 'popular'>('recent');
  const sortScrollRef = useRef<ScrollViewType>(null);
  const [draft, setDraft] = useState<CategoryFiltersDraft>(emptyDraft);
  const [applied, setApplied] = useState<AppliedFilters>({
    search: '',
    categoryId,
    city: '',
    filterOptionIds: []
  });

  const rootCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId]
  );

  const subcategories = useMemo(
    () =>
      categories
        .filter((category) => category.parentId === categoryId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories, categoryId]
  );

  const categoryTitle = useMemo(() => {
    if (!rootCategory) return t.categoryOffers.title;
    return (locale === 'ar' ? rootCategory.nameAr : rootCategory.nameEn) ?? rootCategory.name;
  }, [rootCategory, locale, t.categoryOffers.title]);

  const sortOptions = useMemo(
    () => [
      { value: 'recent' as const, label: t.categoryOffers.recent },
      { value: 'price-low' as const, label: t.categoryOffers.priceLow },
      { value: 'price-high' as const, label: t.categoryOffers.priceHigh },
      { value: 'popular' as const, label: t.categoryOffers.popular }
    ],
    [t.categoryOffers]
  );

  const displayedListings = useMemo(() => {
    return [...listings].sort((a, b) => {
      if (sort === 'price-low') return Number(a.price ?? 0) - Number(b.price ?? 0);
      if (sort === 'price-high') return Number(b.price ?? 0) - Number(a.price ?? 0);
      if (sort === 'popular') return (b.views ?? 0) - (a.views ?? 0);
      return 0;
    });
  }, [listings, sort]);

  const activeFilterCount = countActiveFilters(applied, categoryId);

  useEffect(() => {
    loadCategories(locale, { refresh: useListingsStore.getState().hasLoadedCategories }).catch(() => undefined);
  }, [locale, loadCategories]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (isRtl) {
        sortScrollRef.current?.scrollToEnd({ animated: false });
      } else {
        sortScrollRef.current?.scrollTo({ x: 0, animated: false });
      }
    });
  }, [isRtl, locale, sortOptions.length]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingFilters(true);

    fetchCategoryFilters(categoryId, locale)
      .then((items) => {
        if (!cancelled) setCategoryFilters(items);
      })
      .catch(() => {
        if (!cancelled) setCategoryFilters([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFilters(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, locale]);

  useEffect(() => {
    let cancelled = false;

    if (!hasLoadedOnce) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    fetchFilteredListings({
      page: 1,
      limit: PAGE_SIZE,
      q: applied.search.trim() || undefined,
      categoryId: applied.categoryId || categoryId,
      city: applied.city || undefined,
      minPrice: applied.minPrice,
      maxPrice: applied.maxPrice,
      filterOptionIds: applied.filterOptionIds
    })
      .then((result) => {
        if (cancelled) return;
        setListings(result.items);
        setTotal(result.total);
        setPage(1);
        setHasMore(hasMorePages(result.items.length, result.items.length, PAGE_SIZE, result.total));
        setHasLoadedOnce(true);
      })
      .catch(() => {
        if (cancelled) return;
        setListings([]);
        setTotal(0);
        setHasMore(false);
        setHasLoadedOnce(true);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applied, categoryId]);

  const applyDraft = () => {
    const minPrice = parsePrice(draft.minPrice);
    const maxPrice = parsePrice(draft.maxPrice);
    setApplied({
      search: draft.search.trim(),
      categoryId: draft.subcategoryId || categoryId,
      city: draft.city,
      minPrice,
      maxPrice,
      filterOptionIds: [...draft.filterOptionIds]
    });
    setPage(1);
    setFiltersExpanded(false);
  };

  const resetFilters = () => {
    const nextDraft = emptyDraft();
    setDraft(nextDraft);
    setApplied({
      search: '',
      categoryId,
      city: '',
      filterOptionIds: []
    });
    setPage(1);
  };

  const toggleFilterOption = (optionId: string) => {
    const nextOptionIds = draft.filterOptionIds.includes(optionId)
      ? draft.filterOptionIds.filter((id) => id !== optionId)
      : [...draft.filterOptionIds, optionId];
    setDraft((current) => ({ ...current, filterOptionIds: nextOptionIds }));
    setApplied((prev) => ({ ...prev, filterOptionIds: nextOptionIds }));
    setPage(1);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFilteredListings({
      page: 1,
      limit: PAGE_SIZE,
      q: applied.search.trim() || undefined,
      categoryId: applied.categoryId || categoryId,
      city: applied.city || undefined,
      minPrice: applied.minPrice,
      maxPrice: applied.maxPrice,
      filterOptionIds: applied.filterOptionIds
    })
      .then((result) => {
        setListings(result.items);
        setTotal(result.total);
        setPage(1);
        setHasMore(hasMorePages(result.items.length, result.items.length, PAGE_SIZE, result.total));
      })
      .catch(() => {
        setListings([]);
        setTotal(0);
        setHasMore(false);
      })
      .finally(() => setIsRefreshing(false));
  }, [applied, categoryId]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);
    fetchFilteredListings({
      page: nextPage,
      limit: PAGE_SIZE,
      q: applied.search.trim() || undefined,
      categoryId: applied.categoryId || categoryId,
      city: applied.city || undefined,
      minPrice: applied.minPrice,
      maxPrice: applied.maxPrice,
      filterOptionIds: applied.filterOptionIds
    })
      .then((result) => {
        if (result.items.length === 0) {
          setHasMore(false);
          return;
        }
        setListings((current) => {
          const merged = [...current, ...result.items];
          setHasMore(hasMorePages(merged.length, result.items.length, PAGE_SIZE, result.total));
          return merged;
        });
        setPage(nextPage);
        setTotal(result.total);
      })
      .finally(() => setIsLoadingMore(false));
  }, [applied, categoryId, hasMore, isLoadingMore, isLoading, page]);

  const showSkeleton = isLoading && !hasLoadedOnce;

  const listHeader = (
    <View>
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{categoryTitle}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>
        {total} {t.categoryOffers.available}
      </AppText>

      <CategoryFiltersPanel
        expanded={filtersExpanded}
        onToggleExpanded={() => setFiltersExpanded((current) => !current)}
        locale={locale}
        isRtl={isRtl}
        messages={t.categoryOffers}
        subcategories={subcategories}
        categoryFilters={categoryFilters}
        isLoadingFilters={isLoadingFilters}
        draft={draft}
        onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
        onToggleFilterOption={toggleFilterOption}
        onApply={applyDraft}
        onReset={resetFilters}
        activeFilterCount={activeFilterCount}
      />

      <View style={[styles.sortRow, isRtl ? styles.sortRowRtl : styles.sortRowLtr]}>
        <AppText style={[styles.sortLabel, isRtl ? styles.rtl : styles.ltr]}>{t.categoryOffers.sortBy}</AppText>
        <ScrollView
          ref={sortScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={isRtl ? styles.sortScrollViewRtl : styles.sortScrollViewLtr}
          contentContainerStyle={[styles.sortScroll, isRtl && styles.sortScrollContentRtl]}
        >
          {sortOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setSort(option.value)}
              style={[styles.sortChip, sort === option.value && styles.sortChipActive]}
            >
              <AppText style={[styles.sortChipText, sort === option.value && styles.sortChipTextActive]}>
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <FlatList
      data={showSkeleton ? [] : displayedListings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          {listHeader}
          {showSkeleton ? <ListingListSkeleton count={5} /> : null}
        </>
      }
      ListEmptyComponent={
        !showSkeleton && !isLoading ? <EmptyState message={t.categoryOffers.empty} /> : null
      }
      ListFooterComponent={
        isLoadingMore ? (
          <ActivityIndicator color={colors.brand} style={styles.footerLoader} />
        ) : (
          <View style={styles.footerSpacer} />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.brand]}
          tintColor={colors.brand}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.35}
      renderItem={({ item }) => (
        <ListingCard
          listing={item}
          locale={locale}
          featuredLabel={t.common.featured}
          onPress={() => onListingPress(item.id)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    flexGrow: 1
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
    marginBottom: 14,
    fontSize: 14
  },
  sortRow: {
    marginBottom: 14,
    width: '100%'
  },
  sortRowLtr: {
    alignItems: 'flex-start'
  },
  sortRowRtl: {
    alignItems: 'flex-end'
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 8,
    alignSelf: 'stretch'
  },
  sortScrollViewLtr: {
    direction: 'ltr',
    alignSelf: 'flex-start'
  },
  sortScrollViewRtl: {
    direction: 'rtl',
    alignSelf: 'flex-end'
  },
  sortScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4
  },
  sortScrollContentRtl: {
    flexDirection: 'row-reverse'
  },
  sortChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  sortChipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink
  },
  sortChipTextActive: {
    color: colors.brandDark,
    fontWeight: '800'
  },
  footerLoader: {
    marginVertical: 20
  },
  footerSpacer: {
    height: 8
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
