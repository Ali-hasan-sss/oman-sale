import { useCallback, useEffect } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { ListingCard } from '../components/ListingCard';
import { ListingListSkeleton } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { useAuthStore, useListingsStore } from '../stores';
import { colors } from '../theme';

type FavoritesScreenProps = {
  onListingPress: (listingId: string) => void;
};

export function FavoritesScreen({ onListingPress }: FavoritesScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const accessToken = useAuthStore((state) => state.accessToken);
  const favorites = useListingsStore((state) => state.favorites);
  const isLoading = useListingsStore((state) => state.isLoadingFavorites);
  const isRefreshing = useListingsStore((state) => state.isRefreshingFavorites);
  const hasLoadedFavorites = useListingsStore((state) => state.hasLoadedFavorites);
  const loadFavorites = useListingsStore((state) => state.loadFavorites);
  const resetFavorites = useListingsStore((state) => state.resetFavorites);

  useEffect(() => {
    if (!accessToken) {
      resetFavorites();
      return;
    }
    loadFavorites({ refresh: useListingsStore.getState().hasLoadedFavorites }).catch(() => undefined);
  }, [accessToken, locale, loadFavorites, resetFavorites]);

  const handleRefresh = useCallback(() => {
    loadFavorites({ refresh: true }).catch(() => undefined);
  }, [loadFavorites]);

  const showSkeleton = isLoading && !hasLoadedFavorites;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        accessToken ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand]}
            tintColor={colors.brand}
          />
        ) : undefined
      }
    >
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.common.favorites}</AppText>
      {!accessToken ? (
        <EmptyState message={t.common.loginRequiredHint} />
      ) : showSkeleton ? (
        <ListingListSkeleton count={4} />
      ) : favorites.length === 0 ? (
        <EmptyState message={t.offers.empty} />
      ) : (
        favorites.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            locale={locale}
            featuredLabel={t.common.featured}
            onPress={() => onListingPress(listing.id)}
          />
        ))
      )}
      {isRefreshing && favorites.length > 0 ? (
        <ActivityIndicator color={colors.brand} style={styles.refreshHint} />
      ) : null}
    </ScrollView>
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
    color: colors.ink,
    marginBottom: 16
  },
  refreshHint: {
    marginTop: 12
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
