import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { EmptyState } from '../components/EmptyState';
import { FilterChipsSkeleton, StoreBrowseGridSkeleton } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { getCityLabel, omanCities } from '../lib/oman-cities';
import { fetchPublicStores, fetchStoreTypes, type PublicStore, type StoreType } from '../services/stores.service';
import { colors, radius, shadow } from '../theme';

const fallbackLogo = require('../../assets/nav-logo.png');
const PAGE_SIZE = 12;

type StoresBrowseScreenProps = {
  onStorePress: (slug: string) => void;
};

export function StoresBrowseScreen({ onStorePress }: StoresBrowseScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const text = t.storesBrowse;

  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [storeTypeId, setStoreTypeId] = useState('');
  const [city, setCity] = useState('');
  const [isLoadingStoreTypes, setIsLoadingStoreTypes] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const hasMore = stores.length < total && stores.length > 0;

  useEffect(() => {
    setIsLoadingStoreTypes(true);
    fetchStoreTypes()
      .then((items) => setStoreTypes(Array.isArray(items) ? items : []))
      .catch(() => setStoreTypes([]))
      .finally(() => setIsLoadingStoreTypes(false));
  }, []);

  const loadStores = useCallback(
    async (options?: { page?: number; refresh?: boolean }) => {
      const nextPage = options?.page ?? 1;
      const isRefresh = options?.refresh ?? false;
      if (nextPage === 1) {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await fetchPublicStores({
          q: query.trim() || undefined,
          storeTypeId: storeTypeId || undefined,
          city: city || undefined,
          page: nextPage,
          limit: PAGE_SIZE
        });
        setStores((current) => (nextPage === 1 ? response.items : [...current, ...response.items]));
        setTotal(response.total);
        setPage(nextPage);
        setHasLoadedOnce(true);
      } catch {
        if (nextPage === 1) setStores([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [query, storeTypeId, city]
  );

  useEffect(() => {
    loadStores({ page: 1 }).catch(() => undefined);
  }, [loadStores]);

  const submitSearch = () => {
    setQuery(searchInput.trim());
  };

  const handleRefresh = () => {
    loadStores({ page: 1, refresh: true }).catch(() => undefined);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    loadStores({ page: page + 1 }).catch(() => undefined);
  };

  const showSkeleton = isLoading && page === 1 && !hasLoadedOnce;
  const showStoreGridSkeleton = isLoading && page === 1 && hasLoadedOnce;
  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const inputAlign = isRtl ? styles.inputRtl : styles.inputLtr;

  const listHeader = (
    <View>
      <AppText style={[styles.title, textAlign]}>{text.title}</AppText>
      <AppText style={[styles.subtitle, textAlign]}>{text.subtitle}</AppText>
      <AppText style={[styles.meta, textAlign]}>
        {total.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')} {text.results}
      </AppText>

      <View style={styles.searchRow}>
        <AppTextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder={text.searchPlaceholder}
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          onSubmitEditing={submitSearch}
          style={[styles.searchInput, inputAlign]}
        />
        <Pressable style={styles.searchButton} onPress={submitSearch}>
          <AppText style={styles.searchButtonText}>{text.search}</AppText>
        </Pressable>
      </View>

      {isLoadingStoreTypes ? (
        <FilterChipsSkeleton count={6} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          indicatorStyle="black"
          style={isRtl ? styles.chipsRtl : undefined}
          contentContainerStyle={[styles.chips, isRtl && styles.chipsContentRtl]}
        >
          <FilterChip
            label={text.allStoreTypes}
            active={!storeTypeId}
            onPress={() => setStoreTypeId('')}
          />
          {storeTypes.map((storeType) => (
            <FilterChip
              key={storeType.id}
              label={locale === 'en' ? storeType.nameEn : storeType.nameAr}
              active={storeTypeId === storeType.id}
              onPress={() => setStoreTypeId(storeTypeId === storeType.id ? '' : storeType.id)}
            />
          ))}
        </ScrollView>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        indicatorStyle="black"
        style={isRtl ? styles.chipsRtl : undefined}
        contentContainerStyle={[styles.chips, isRtl && styles.chipsContentRtl]}
      >
        <FilterChip
          label={text.allCities}
          active={!city}
          onPress={() => setCity('')}
        />
        {omanCities.map((cityOption) => (
          <FilterChip
            key={cityOption.value}
            label={locale === 'en' ? cityOption.en : cityOption.ar}
            active={city === cityOption.value}
            onPress={() => setCity(city === cityOption.value ? '' : cityOption.value)}
          />
        ))}
      </ScrollView>

      {showSkeleton || showStoreGridSkeleton ? <StoreBrowseGridSkeleton count={4} /> : null}
    </View>
  );

  return (
    <FlatList
      data={showSkeleton || showStoreGridSkeleton ? [] : stores}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.columnWrap}
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.brand]} tintColor={colors.brand} />
      }
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        !showSkeleton && !showStoreGridSkeleton ? <EmptyState message={text.empty} /> : null
      }
      renderItem={({ item }) => (
        <StoreBrowseCard store={item} locale={locale} listingsLabel={text.listings} onPress={() => onStorePress(item.slug)} />
      )}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.35}
      ListFooterComponent={
        isLoadingMore ? <ActivityIndicator color={colors.brand} style={styles.footerLoader} /> : null
      }
    />
  );
}

function StoreBrowseCard({
  store,
  locale,
  listingsLabel,
  onPress
}: {
  store: PublicStore;
  locale: 'ar' | 'en';
  listingsLabel: string;
  onPress: () => void;
}) {
  const name = locale === 'en' ? store.nameEn : store.nameAr;
  const typeName = locale === 'en' ? store.storeType?.nameEn : store.storeType?.nameAr;
  const cityLabel = getCityLabel(store.city ?? '', locale);

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.cardCoverWrap}>
        {store.coverUrl ? (
          <Image source={{ uri: store.coverUrl }} style={styles.cardCover} />
        ) : (
          <View style={styles.cardCoverFallback}>
            <Image source={fallbackLogo} style={styles.cardCoverLogo} resizeMode="contain" />
          </View>
        )}
        <View style={styles.cardLogoWrap}>
          {store.logoUrl ? (
            <Image source={{ uri: store.logoUrl }} style={styles.cardLogo} />
          ) : (
            <Image source={fallbackLogo} style={styles.cardLogoFallback} resizeMode="contain" />
          )}
        </View>
      </View>
      <AppText style={styles.cardTitle} numberOfLines={2}>
        {name}
      </AppText>
      {typeName ? (
        <View style={styles.typeBadge}>
          <AppText style={styles.typeBadgeText} numberOfLines={1}>
            {typeName}
          </AppText>
        </View>
      ) : null}
      <AppText style={styles.cardMeta}>
        {store.listingsCount ?? 0} {listingsLabel}
        {cityLabel ? ` · ${cityLabel}` : ''}
      </AppText>
    </Pressable>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <AppText style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 4
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 14
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface
  },
  searchButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14
  },
  chipsRtl: {
    direction: 'rtl'
  },
  chipsContentRtl: {
    flexDirection: 'row-reverse'
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    maxWidth: 160
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand
  },
  chipText: {
    fontWeight: '700',
    color: colors.ink,
    fontSize: 13
  },
  chipTextActive: {
    color: '#fff'
  },
  columnWrap: {
    gap: 12
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow
  },
  cardPressed: {
    opacity: 0.92
  },
  cardCoverWrap: {
    height: 96,
    backgroundColor: colors.brandSoft
  },
  cardCover: {
    width: '100%',
    height: '100%'
  },
  cardCoverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardCoverLogo: {
    width: 56,
    height: 56,
    opacity: 0.5
  },
  cardLogoWrap: {
    position: 'absolute',
    bottom: -18,
    start: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
    backgroundColor: colors.surface
  },
  cardLogo: {
    width: '100%',
    height: '100%'
  },
  cardLogoFallback: {
    width: '100%',
    height: '100%',
    padding: 6
  },
  cardTitle: {
    marginTop: 24,
    paddingHorizontal: 12,
    fontWeight: '900',
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18
  },
  cardCategory: {
    paddingHorizontal: 12,
    marginTop: 4,
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: '700'
  },
  typeBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    marginHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857'
  },
  cardMeta: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600'
  },
  footerLoader: {
    marginVertical: 16
  },
  rtl: { textAlign: 'right' },
  ltr: { textAlign: 'left' },
  inputRtl: { textAlign: 'right' },
  inputLtr: { textAlign: 'left' }
});
