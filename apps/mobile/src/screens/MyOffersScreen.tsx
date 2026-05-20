import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { ListingCard } from '../components/ListingCard';
import { useI18n } from '../i18n';
import { useAuthStore, useListingsStore } from '../stores';
import { colors } from '../theme';

export function MyOffersScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { locale, t, isRtl } = useI18n();
  const listings = useListingsStore((state) => state.my);
  const isLoading = useListingsStore((state) => state.isLoadingMy);
  const loadMy = useListingsStore((state) => state.loadMy);
  const resetMy = useListingsStore((state) => state.resetMy);

  useEffect(() => {
    if (!accessToken) {
      resetMy();
      return;
    }
    loadMy().catch(() => undefined);
  }, [accessToken, locale, loadMy, resetMy]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.myOffers.title}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.myOffers.subtitle}</AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
      ) : listings.length === 0 ? (
        <EmptyState message={t.myOffers.empty} />
      ) : (
        listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} locale={locale} featuredLabel={t.common.featured} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 120
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
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
