import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { ListingCard } from '../components/ListingCard';
import { ListingListSkeleton } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { getCityLabel } from '../lib/oman-cities';
import { fetchCategories, fetchFilteredListings, type CategoryOption } from '../services/listings.service';
import { fetchPublicStores, type PublicStore } from '../services/stores.service';
import type { Listing } from '../types';
import { colors, radius, shadow } from '../theme';

const fallbackLogo = require('../../assets/nav-logo.png');
const RESULT_LIMIT = 8;

type GlobalSearchScreenProps = {
  onListingPress: (listingId: string) => void;
  onStorePress: (slug: string) => void;
  onCategoryPress: (categoryId: string) => void;
  onBrowseOffers: () => void;
  onBrowseStores: () => void;
};

export function GlobalSearchScreen({
  onListingPress,
  onStorePress,
  onCategoryPress,
  onBrowseOffers,
  onBrowseStores
}: GlobalSearchScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const text = t.globalSearch;
  const { scrollBottomPadding } = useScreenInsets();
  const textAlign = isRtl ? styles.rtl : styles.ltr;

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories(locale)
      .then((items) => setCategories(Array.isArray(items) ? items : []))
      .catch(() => setCategories([]));
  }, [locale]);

  const matchedCategories = useMemo(() => {
    if (!query) return [];
    const term = query.toLowerCase();
    return categories.filter((category) => {
      const name = (locale === 'en' ? category.nameEn : category.nameAr) ?? category.name;
      return name.toLowerCase().includes(term) || (category.slug ?? '').toLowerCase().includes(term);
    });
  }, [categories, locale, query]);

  const loadResults = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setListings([]);
      setStores([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [listingsResult, storesResult] = await Promise.all([
        fetchFilteredListings({ q: trimmed, page: 1, limit: RESULT_LIMIT }),
        fetchPublicStores({ q: trimmed, page: 1, limit: RESULT_LIMIT })
      ]);
      setListings(listingsResult.items);
      setStores(storesResult.items);
    } catch {
      setListings([]);
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults(query).catch(() => undefined);
  }, [loadResults, query]);

  const submitSearch = () => {
    setQuery(searchInput.trim());
  };

  const hasResults = matchedCategories.length > 0 || listings.length > 0 || stores.length > 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        query ? (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadResults(query).catch(() => undefined)}
            colors={[colors.brand]}
            tintColor={colors.brand}
          />
        ) : undefined
      }
    >
      <AppText style={[styles.title, textAlign]}>{text.title}</AppText>
      <AppText style={[styles.hint, textAlign]}>{text.hint}</AppText>

      <AppTextInput
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder={text.placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        onSubmitEditing={submitSearch}
        style={[styles.searchInput, isRtl ? styles.inputRtl : styles.inputLtr]}
      />
      <Pressable style={styles.searchButton} onPress={submitSearch}>
        <AppText style={styles.searchButtonText}>{text.search}</AppText>
      </Pressable>

      {!query ? null : (
        <AppText style={[styles.queryLabel, textAlign]}>
          {text.queryLabel}: <AppText style={styles.queryValue}>&quot;{query}&quot;</AppText>
        </AppText>
      )}

      {query && isLoading ? <ListingListSkeleton count={3} /> : null}

      {query && !isLoading && !hasResults ? (
        <AppText style={[styles.empty, textAlign]}>{text.empty}</AppText>
      ) : null}

      {query && !isLoading && matchedCategories.length > 0 ? (
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, textAlign]}>{text.categories}</AppText>
          <View style={[styles.chipsWrap, isRtl && styles.chipsWrapRtl]}>
            {matchedCategories.slice(0, 12).map((category) => (
              <Pressable
                key={category.id}
                style={({ pressed }) => [styles.categoryChip, pressed && styles.chipPressed]}
                onPress={() => onCategoryPress(category.id)}
              >
                <AppText style={styles.categoryChipText} numberOfLines={1}>
                  {(locale === 'en' ? category.nameEn : category.nameAr) ?? category.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {query && !isLoading && listings.length > 0 ? (
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRtl && styles.sectionHeaderRtl]}>
            <AppText style={[styles.sectionTitle, textAlign]}>{text.listings}</AppText>
            <Pressable onPress={onBrowseOffers}>
              <AppText style={styles.viewAll}>{text.viewAll}</AppText>
            </Pressable>
          </View>
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
              featuredLabel={t.common.featured}
              onPress={() => onListingPress(listing.id)}
            />
          ))}
        </View>
      ) : null}

      {query && !isLoading && stores.length > 0 ? (
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRtl && styles.sectionHeaderRtl]}>
            <AppText style={[styles.sectionTitle, textAlign]}>{text.stores}</AppText>
            <Pressable onPress={onBrowseStores}>
              <AppText style={styles.viewAll}>{text.viewAll}</AppText>
            </Pressable>
          </View>
          {stores.map((store) => {
            const name = locale === 'en' ? store.nameEn : store.nameAr;
            const bio = locale === 'en' ? store.bioEn : store.bioAr;
            const cityLabel = getCityLabel(store.city ?? '', locale);
            return (
              <Pressable
                key={store.id}
                style={({ pressed }) => [styles.storeCard, pressed && styles.chipPressed]}
                onPress={() => onStorePress(store.slug)}
              >
                {store.coverUrl ? (
                  <Image source={{ uri: store.coverUrl }} style={styles.storeCover} />
                ) : (
                  <View style={styles.storeCoverFallback}>
                    <Image source={fallbackLogo} style={styles.storeCoverLogo} resizeMode="contain" />
                  </View>
                )}
                <View style={styles.storeBody}>
                  <AppText style={[styles.storeName, textAlign]} numberOfLines={1}>
                    {name}
                  </AppText>
                  {bio ? (
                    <AppText style={[styles.storeBio, textAlign]} numberOfLines={2}>
                      {bio}
                    </AppText>
                  ) : null}
                  <AppText style={[styles.storeMeta, textAlign]}>
                    {store.listingsCount ?? 0} {t.storesBrowse.listings}
                    {cityLabel ? ` · ${cityLabel}` : ''}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  hint: {
    color: colors.muted,
    lineHeight: 22
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface
  },
  searchButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '800'
  },
  queryLabel: {
    color: colors.muted,
    fontSize: 14
  },
  queryValue: {
    color: colors.ink,
    fontWeight: '800'
  },
  empty: {
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 24
  },
  section: {
    gap: 10
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionHeaderRtl: {
    flexDirection: 'row-reverse'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink
  },
  viewAll: {
    color: colors.brand,
    fontWeight: '800',
    fontSize: 13
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chipsWrapRtl: {
    flexDirection: 'row-reverse'
  },
  categoryChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: '100%'
  },
  categoryChipText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 13
  },
  chipPressed: {
    opacity: 0.9
  },
  storeCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...shadow
  },
  storeCover: {
    width: '100%',
    height: 96
  },
  storeCoverFallback: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft
  },
  storeCoverLogo: {
    width: 56,
    height: 56,
    opacity: 0.5
  },
  storeBody: {
    padding: 12,
    gap: 4
  },
  storeName: {
    fontWeight: '900',
    color: colors.ink,
    fontSize: 16
  },
  storeBio: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  storeMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600'
  },
  rtl: { textAlign: 'right' },
  ltr: { textAlign: 'left' },
  inputRtl: { textAlign: 'right' },
  inputLtr: { textAlign: 'left' }
});
