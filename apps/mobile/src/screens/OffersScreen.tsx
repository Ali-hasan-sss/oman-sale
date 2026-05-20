import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { EmptyState } from '../components/EmptyState';
import { ListingCard } from '../components/ListingCard';
import { useI18n } from '../i18n';
import { useListingsStore } from '../stores';
import { colors, radius } from '../theme';

export function OffersScreen() {
  const { locale, t, isRtl } = useI18n();
  const listings = useListingsStore((state) => state.all);
  const isLoading = useListingsStore((state) => state.isLoadingAll);
  const loadAll = useListingsStore((state) => state.loadAll);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadAll(40).catch(() => undefined);
  }, [locale, loadAll]);

  const filtered = listings.filter((listing) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [listing.title, listing.city, listing.area].filter(Boolean).some((value) => value!.toLowerCase().includes(term));
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.offers.title}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.offers.subtitle}</AppText>
      <AppTextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.common.search}
        placeholderTextColor={colors.muted}
        style={[styles.search, isRtl ? styles.searchRtl : styles.searchLtr]}
      />
      {isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
      ) : filtered.length === 0 ? (
        <EmptyState message={t.offers.empty} />
      ) : (
        filtered.map((listing) => (
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
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
