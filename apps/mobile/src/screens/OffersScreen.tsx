import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { EmptyState } from '../components/EmptyState';
import { ListingCard } from '../components/ListingCard';
import { ListingListSkeleton } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { useListingsStore } from '../stores';
import { colors, radius } from '../theme';

type OffersScreenProps = {
  onListingPress: (listingId: string) => void;
};

export function OffersScreen({ onListingPress }: OffersScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const listings = useListingsStore((state) => state.all);
  const isLoading = useListingsStore((state) => state.isLoadingAll);
  const isLoadingMore = useListingsStore((state) => state.isLoadingMoreAll);
  const isRefreshing = useListingsStore((state) => state.isRefreshingAll);
  const hasLoadedAll = useListingsStore((state) => state.hasLoadedAll);
  const loadAll = useListingsStore((state) => state.loadAll);
  const loadMoreAll = useListingsStore((state) => state.loadMoreAll);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadAll({ refresh: useListingsStore.getState().hasLoadedAll }).catch(() => undefined);
  }, [locale, loadAll]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return listings;
    return listings.filter((listing) => {
      return [listing.title, listing.city, listing.area]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [listings, query]);

  const handleRefresh = useCallback(() => {
    loadAll({ refresh: true }).catch(() => undefined);
  }, [loadAll]);

  const handleLoadMore = useCallback(() => {
    if (query.trim()) return;
    loadMoreAll().catch(() => undefined);
  }, [loadMoreAll, query]);

  const showSkeleton = isLoading && !hasLoadedAll;

  const listHeader = (
    <View>
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.offers.title}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.offers.subtitle}</AppText>
      <AppTextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.common.search}
        placeholderTextColor={colors.muted}
        style={[styles.search, isRtl ? styles.searchRtl : styles.searchLtr]}
      />
    </View>
  );

  return (
    <FlatList
      data={showSkeleton ? [] : filtered}
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
        !showSkeleton && !isLoading ? <EmptyState message={t.offers.empty} /> : null
      }
      ListFooterComponent={
        isLoadingMore && !query.trim() ? (
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
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
    marginBottom: 16
  },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16
  },
  searchRtl: {
    textAlign: 'right'
  },
  searchLtr: {
    textAlign: 'left'
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
