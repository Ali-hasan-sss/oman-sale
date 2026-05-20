import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { ListingCard } from '../components/ListingCard';
import { useI18n } from '../i18n';
import { useAuthStore, useListingsStore } from '../stores';
import { colors } from '../theme';

export function FavoritesScreen() {
  const { locale, t, isRtl } = useI18n();
  const accessToken = useAuthStore((state) => state.accessToken);
  const favorites = useListingsStore((state) => state.favorites);
  const isLoading = useListingsStore((state) => state.isLoadingFavorites);
  const loadFavorites = useListingsStore((state) => state.loadFavorites);

  useEffect(() => {
    if (!accessToken) return;
    loadFavorites().catch(() => undefined);
  }, [accessToken, locale, loadFavorites]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.common.favorites}</AppText>
      {!accessToken ? (
        <EmptyState message={t.common.loginRequiredHint} />
      ) : isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
      ) : favorites.length === 0 ? (
        <EmptyState message={t.offers.empty} />
      ) : (
        favorites.map((listing) => (
          <ListingCard key={listing.id} listing={listing} locale={locale} featuredLabel={t.common.featured} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 16
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
