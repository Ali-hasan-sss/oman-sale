import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
const CONTENT_PADDING = 16;
const CARD_GAP = 12;
const SCREEN_WIDTH = Dimensions.get('window').width;
const STORE_CARD_WIDTH = (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP) / 2;

type ChipItem = {
  key: string;
  value: string;
  label: string;
};

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

  const storeTypeChips = useMemo(
    (): ChipItem[] => [
      { key: 'all', value: '', label: text.allStoreTypes },
      ...storeTypes.map((storeType) => ({
        key: storeType.id,
        value: storeType.id,
        label: locale === 'en' ? storeType.nameEn : storeType.nameAr
      }))
    ],
    [locale, storeTypes, text.allStoreTypes]
  );

  const cityChips = useMemo(
    (): ChipItem[] => [
      { key: 'all', value: '', label: text.allCities },
      ...omanCities.map((cityOption) => ({
        key: cityOption.value,
        value: cityOption.value,
        label: locale === 'en' ? cityOption.en : cityOption.ar
      }))
    ],
    [locale, text.allCities]
  );

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 240) {
      handleLoadMore();
    }
  };

  const showSkeleton = isLoading && page === 1 && !hasLoadedOnce;
  const showStoreGridSkeleton = isLoading && page === 1 && hasLoadedOnce;
  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const inputAlign = isRtl ? styles.inputRtl : styles.inputLtr;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.brand]} tintColor={colors.brand} />
      }
      onScroll={handleScroll}
      scrollEventThrottle={200}
    >
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
        <FilterChipsSkeleton count={6} isRtl={isRtl} />
      ) : (
        <ChipRow chips={storeTypeChips} isRtl={isRtl} selectedValue={storeTypeId} onSelect={setStoreTypeId} />
      )}

      <ChipRow chips={cityChips} isRtl={isRtl} selectedValue={city} onSelect={setCity} />

      {showSkeleton || showStoreGridSkeleton ? (
        <StoreBrowseGridSkeleton count={4} />
      ) : stores.length === 0 ? (
        <EmptyState message={text.empty} />
      ) : (
        <View style={styles.grid}>
          {stores.map((store) => (
            <StoreBrowseCard
              key={store.id}
              store={store}
              locale={locale}
              listingsLabel={text.listings}
              onPress={() => onStorePress(store.slug)}
            />
          ))}
        </View>
      )}

      {isLoadingMore ? <ActivityIndicator color={colors.brand} style={styles.footerLoader} /> : null}
    </ScrollView>
  );
}

function ChipRow({
  chips,
  isRtl,
  selectedValue,
  onSelect
}: {
  chips: ChipItem[];
  isRtl: boolean;
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const orderedChips = isRtl ? [...chips].reverse() : chips;
  const chipsKey = orderedChips.map((chip) => chip.key).join('|');

  const alignScroll = useCallback(() => {
    if (isRtl) {
      scrollRef.current?.scrollToEnd({ animated: false });
      return;
    }
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [isRtl]);

  useEffect(() => {
    requestAnimationFrame(alignScroll);
  }, [alignScroll, chipsKey]);

  return (
    <View style={styles.chipsScrollWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
        onLayout={alignScroll}
      >
        {orderedChips.map((chip) => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            active={selectedValue === chip.value}
            onPress={() => onSelect(selectedValue === chip.value ? '' : chip.value)}
          />
        ))}
      </ScrollView>
    </View>
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
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <AppText style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%'
  },
  content: {
    padding: CONTENT_PADDING,
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
  chipsScrollWrap: {
    width: '100%',
    maxWidth: SCREEN_WIDTH - CONTENT_PADDING * 2,
    overflow: 'hidden'
  },
  chipsScroll: {
    flexGrow: 0
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 14
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    width: '100%'
  },
  card: {
    width: STORE_CARD_WIDTH,
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
