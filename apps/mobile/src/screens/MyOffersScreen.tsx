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

type MyOffersScreenProps = {
  onListingPress: (listingId: string) => void;
};

export function MyOffersScreen({ onListingPress }: MyOffersScreenProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const listings = useListingsStore((state) => state.my);
  const isLoading = useListingsStore((state) => state.isLoadingMy);
  const isRefreshing = useListingsStore((state) => state.isRefreshingMy);
  const hasLoadedMy = useListingsStore((state) => state.hasLoadedMy);
  const loadMy = useListingsStore((state) => state.loadMy);
  const resetMy = useListingsStore((state) => state.resetMy);

  useEffect(() => {
    if (!accessToken) {
      resetMy();
      return;
    }
    loadMy({ refresh: useListingsStore.getState().hasLoadedMy }).catch(() => undefined);
  }, [accessToken, locale, loadMy, resetMy]);

  const handleRefresh = useCallback(() => {
    loadMy({ refresh: true }).catch(() => undefined);
  }, [loadMy]);

  const showSkeleton = isLoading && !hasLoadedMy;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.brand]}
          tintColor={colors.brand}
        />
      }
    >
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.myOffers.title}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.myOffers.subtitle}</AppText>
      {showSkeleton ? (
        <ListingListSkeleton count={4} />
      ) : listings.length === 0 ? (
        <EmptyState message={t.myOffers.empty} />
      ) : (
        listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            locale={locale}
            featuredLabel={t.common.featured}
            onPress={() => onListingPress(listing.id)}
          />
        ))
      )}
      {isRefreshing && listings.length > 0 ? (
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
    color: colors.ink
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
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
