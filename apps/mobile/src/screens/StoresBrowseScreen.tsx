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

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { EmptyState } from '../components/EmptyState';
import { HeroBannersSection } from '../components/HeroBannersSection';
import { FilterChipsSkeleton, StoreBrowseGridSkeleton } from '../components/skeleton';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { CategoryIcon } from '../lib/category-icons';
import { alignSelfStart, rowDirection } from '../lib/layout-direction';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { getCityLabel, omanCities } from '../lib/oman-cities';
import { fetchPublicStores, fetchStoreTypes, type PublicStore, type StoreType } from '../services/stores.service';
import { colors, radius, shadow } from '../theme';

const fallbackLogo = require('../../assets/logo-symbol.png');
const PAGE_SIZE = 12;
const CONTENT_PADDING = 16;
const CARD_GAP = 12;
const SCREEN_WIDTH = Dimensions.get('window').width;
const STORE_CARD_WIDTH = (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP) / 2;

type ChipItem = {
  key: string;
  value: string;
  label: string;
  icon?: string | null;
};

type StoresBrowseScreenProps = {
  onStorePress: (slug: string) => void;
  onAddStore?: () => void;
};

export function StoresBrowseScreen({ onStorePress, onAddStore }: StoresBrowseScreenProps) {
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
      { key: 'all', value: '', label: locale === 'en' ? 'All stores' : 'كل المتاجر', icon: '🛍️' },
      ...storeTypes.map((storeType) => ({
        key: storeType.id,
        value: storeType.id,
        label: locale === 'en' ? storeType.nameEn : storeType.nameAr,
        icon: storeType.icon
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
      {/* hero band: white with soft green/red light, Islamic star pattern and a tricolor foot */}
      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(75,187,120,0.16)', 'rgba(75,187,120,0)']}
          start={{ x: isRtl ? 0 : 1, y: 0.5 }}
          end={{ x: isRtl ? 0.7 : 0.3, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Pattern id="starPattern" width="56" height="56" patternUnits="userSpaceOnUse">
              <Rect x="18" y="18" width="20" height="20" fill="none" stroke="#168c4e" strokeOpacity={0.1} strokeWidth={1.1} />
              <Rect x="18" y="18" width="20" height="20" fill="none" stroke="#168c4e" strokeOpacity={0.1} strokeWidth={1.1} transform="rotate(45 28 28)" />
              <Circle cx="28" cy="28" r="5" fill="none" stroke="#168c4e" strokeOpacity={0.1} strokeWidth={1.1} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#starPattern)" />
        </Svg>
        <AppText style={[styles.heroEmoji, isRtl ? { left: 10 } : { right: 10 }]}>🏬</AppText>

        <AppText style={[styles.title, textAlign]}>{text.title}</AppText>
        <AppText style={[styles.subtitle, textAlign]}>
          {locale === 'en'
            ? 'Verified showrooms, offices and shops listing across Oman.'
            : 'معارض ومكاتب ومتاجر موثّقة تعرض إعلاناتها في سلطنة عُمان.'}
        </AppText>

        {isLoadingStoreTypes ? (
          <FilterChipsSkeleton count={6} isRtl={isRtl} />
        ) : (
          <ChipRow chips={storeTypeChips} isRtl={isRtl} selectedValue={storeTypeId} onSelect={setStoreTypeId} />
        )}

        {onAddStore ? (
          <Pressable onPress={onAddStore} style={({ pressed }) => [styles.addStore, alignSelfStart(isRtl), pressed && { opacity: 0.9 }]}>
            <Ionicons name="add" size={20} color="#fff" />
            <AppText style={styles.addStoreText}>{locale === 'en' ? 'Add your store' : 'أضف متجرك'}</AppText>
          </Pressable>
        ) : null}

        <View style={styles.tricolor}>
          <View style={[styles.tricolorPart, { backgroundColor: '#f32b2b' }]} />
          <View style={[styles.tricolorPart, { backgroundColor: '#ffffff' }]} />
          <View style={[styles.tricolorPart, { backgroundColor: '#2da864' }]} />
        </View>
      </View>

      <AppText style={[styles.meta, textAlign]}>
        <AppText style={styles.metaCount}>{total.toLocaleString('en-US')}</AppText>{' '}
        {locale === 'en' ? 'stores in Oman' : 'متجر في عُمان'}
      </AppText>

      <View style={[styles.searchRow, rowDirection(isRtl)]}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <AppTextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder={locale === 'en' ? 'Search for a store...' : 'ابحث عن متجر...'}
          placeholderTextColor="#94a3b8"
          returnKeyType="search"
          onSubmitEditing={submitSearch}
          onBlur={submitSearch}
          style={[styles.searchInput, inputAlign]}
        />
      </View>

      <ChipRow chips={cityChips} isRtl={isRtl} selectedValue={city} onSelect={setCity} />

      <HeroBannersSection placement="STORES" flush />

      {showSkeleton || showStoreGridSkeleton ? (
        <StoreBrowseGridSkeleton count={4} />
      ) : stores.length === 0 ? (
        <EmptyState message={text.empty} />
      ) : (
        <View style={[styles.grid, rowDirection(isRtl)]}>
          {stores.map((store) => (
            <StoreBrowseCard key={store.id} store={store} locale={locale} isRtl={isRtl} onPress={() => onStorePress(store.slug)} />
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
            icon={chip.icon}
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
  isRtl,
  onPress
}: {
  store: PublicStore;
  locale: 'ar' | 'en';
  isRtl: boolean;
  onPress: () => void;
}) {
  const [coverBroken, setCoverBroken] = useState(false);
  const name = locale === 'en' ? store.nameEn : store.nameAr;
  const typeName = locale === 'en' ? store.storeType?.nameEn : store.storeType?.nameAr;
  const cityLabel = getCityLabel(store.city ?? '', locale);
  // "معرض الأصيل" -> "أ": skip a generic first word and the article "ال".
  const words = (name || '').trim().split(/\s+/);
  const keyWord = ((words.length > 1 ? words[1] : words[0]) ?? '').replace(/^ال(?=\S{2,})/, '');
  const initial = keyWord.charAt(0).replace('ا', 'أ');

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.cardCoverWrap}>
        <LinearGradient colors={['#2da864', '#11703e', '#0a4024']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {store.coverUrl && !coverBroken ? (
          <Image source={{ uri: store.coverUrl }} style={styles.cardCover} onError={() => setCoverBroken(true)} />
        ) : (
          <View style={styles.cardCoverFallback}>
            {store.storeType?.icon ? (
              <CategoryIcon icon={store.storeType.icon} size={40} color="#ffffff" />
            ) : (
              <AppText style={styles.coverEmoji}>🏬</AppText>
            )}
          </View>
        )}
        <View style={[styles.cardLogoWrap, isRtl ? { right: 10 } : { left: 10 }]}>
          {store.logoUrl ? (
            <Image source={{ uri: store.logoUrl }} style={styles.cardLogo} />
          ) : (
            <AppText style={styles.cardInitial}>{initial}</AppText>
          )}
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={[styles.nameRow, rowDirection(isRtl)]}>
          <AppText style={styles.cardTitle} numberOfLines={2}>
            {name}
          </AppText>
          {store.trustBadgeApproved ? <VerifiedBadge /> : null}
        </View>
        {typeName ? (
          <AppText style={styles.typeText} numberOfLines={1}>
            {typeName}
          </AppText>
        ) : null}
        {cityLabel ? (
          <View style={[styles.placeRow, rowDirection(isRtl)]}>
            <Ionicons name="location-outline" size={12} color="#64748b" />
            <AppText style={styles.placeText} numberOfLines={1}>
              {cityLabel}
            </AppText>
          </View>
        ) : null}
        <View style={[styles.cardFooter, rowDirection(isRtl)]}>
          <AppText style={styles.cardFooterText} numberOfLines={1}>
            {locale === 'en' ? 'View listings' : 'عرض الإعلانات'}
            {store.listingsCount ? ` (${store.listingsCount})` : ''}
          </AppText>
          <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={14} color="#11703e" />
        </View>
      </View>
    </Pressable>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onPress
}: {
  label: string;
  icon?: string | null;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {icon ? <CategoryIcon icon={icon} size={16} color={active ? '#ffffff' : '#11703e'} /> : null}
      <AppText style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: CONTENT_PADDING,
    paddingTop: 0,
    gap: 12
  },
  hero: {
    marginHorizontal: -CONTENT_PADDING,
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 22,
    paddingBottom: 22,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    gap: 12
  },
  heroEmoji: {
    position: 'absolute',
    top: 14,
    fontSize: 54,
    lineHeight: 66,
    opacity: 0.95
  },
  tricolor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    flexDirection: 'row'
  },
  tricolorPart: {
    flex: 1
  },
  title: {
    fontSize: 30,
    lineHeight: 42,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    color: '#475569',
    lineHeight: 22,
    fontSize: 14.5
  },
  addStore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#168c4e',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#168c4e',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  addStoreText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15
  },
  meta: {
    color: '#475569',
    fontSize: 15,
    marginTop: 4
  },
  metaCount: {
    fontWeight: '900',
    color: colors.ink
  },
  searchRow: {
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fff',
    paddingHorizontal: 16
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
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
    paddingBottom: 4
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.surface,
    maxWidth: 200
  },
  chipActive: {
    backgroundColor: '#168c4e',
    borderColor: '#168c4e'
  },
  chipText: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13
  },
  chipTextActive: {
    color: '#fff'
  },
  grid: {
    flexWrap: 'wrap',
    gap: CARD_GAP,
    width: '100%'
  },
  card: {
    width: STORE_CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow
  },
  cardPressed: {
    opacity: 0.92
  },
  cardCoverWrap: {
    height: 92,
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
    overflow: 'visible'
  },
  cardCover: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21
  },
  cardCoverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  coverEmoji: {
    fontSize: 38,
    lineHeight: 48
  },
  cardLogoWrap: {
    position: 'absolute',
    bottom: -22,
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.surface,
    overflow: 'hidden',
    backgroundColor: '#11703e',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardLogo: {
    width: '100%',
    height: '100%'
  },
  cardInitial: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center'
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 28,
    paddingBottom: 10,
    flex: 1
  },
  nameRow: {
    alignItems: 'center',
    gap: 4
  },
  cardTitle: {
    flexShrink: 1,
    fontWeight: '900',
    color: colors.ink,
    fontSize: 14.5,
    lineHeight: 21
  },
  typeText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '800',
    color: '#f32b2b'
  },
  placeRow: {
    marginTop: 3,
    alignItems: 'center',
    gap: 3
  },
  placeText: {
    flexShrink: 1,
    fontSize: 11.5,
    color: '#64748b'
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardFooterText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
    color: '#11703e'
  },
  footerLoader: {
    marginVertical: 16
  },
  rtl: { textAlign: 'right' },
  ltr: { textAlign: 'left' },
  inputRtl: { textAlign: 'right' },
  inputLtr: { textAlign: 'left' }
});
