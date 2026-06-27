import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import { AppText } from '../components/AppText';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { EmptyState } from '../components/EmptyState';
import { ListingCard } from '../components/ListingCard';
import { StoreDetailSkeleton } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { getCityLabel } from '../lib/oman-cities';
import { fetchPublicStoreAds, fetchPublicStoreBySlug, type PublicStore } from '../services/stores.service';
import type { Listing } from '../types';
import { colors, radius, shadow } from '../theme';

const fallbackLogo = require('../../assets/nav-logo.png');
const PAGE_SIZE = 12;

type StoreDetailScreenProps = {
  slug: string;
  onListingPress: (listingId: string) => void;
};

export function StoreDetailScreen({ slug, onListingPress }: StoreDetailScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const text = t.storePublic;

  const [store, setStore] = useState<PublicStore | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const hasMore = listings.length < total;
  const textAlign = isRtl ? styles.rtl : styles.ltr;

  const loadStore = useCallback(async () => {
    setIsLoadingStore(true);
    setError('');
    try {
      const data = await fetchPublicStoreBySlug(slug);
      setStore(data);
    } catch {
      setStore(null);
      setError(text.notFound);
    } finally {
      setIsLoadingStore(false);
    }
  }, [slug, text.notFound]);

  const loadListings = useCallback(
    async (options?: { page?: number; refresh?: boolean }) => {
      const nextPage = options?.page ?? 1;
      const isRefresh = options?.refresh ?? false;
      if (nextPage === 1) {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoadingListings(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await fetchPublicStoreAds(slug, { page: nextPage, limit: PAGE_SIZE });
        setListings((current) => (nextPage === 1 ? response.items : [...current, ...response.items]));
        setTotal(response.total);
        setPage(nextPage);
      } catch {
        if (nextPage === 1) setListings([]);
      } finally {
        setIsLoadingListings(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    setPage(1);
    setListings([]);
    loadStore().catch(() => undefined);
  }, [loadStore]);

  useEffect(() => {
    if (!store) return;
    loadListings({ page: 1 }).catch(() => undefined);
  }, [loadListings, store]);

  const handleRefresh = () => {
    loadStore().catch(() => undefined);
    if (store) loadListings({ page: 1, refresh: true }).catch(() => undefined);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore || isLoadingListings) return;
    loadListings({ page: page + 1 }).catch(() => undefined);
  };

  if (isLoadingStore) {
    return (
      <View style={styles.loaderWrap}>
        <StoreDetailSkeleton />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={[styles.loaderWrap, { paddingBottom: scrollBottomPadding }]}>
        <EmptyState message={error || text.notFound} />
      </View>
    );
  }

  const storeName = locale === 'en' ? store.nameEn : store.nameAr;
  const storeBio = locale === 'en' ? store.bioEn : store.bioAr;
  const typeName = locale === 'en' ? store.storeType?.nameEn : store.storeType?.nameAr;
  const cityLabel = getCityLabel(store.city ?? '', locale);

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.brand]} tintColor={colors.brand} />
      }
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 120) {
          handleLoadMore();
        }
      }}
      scrollEventThrottle={120}
    >
      <View style={styles.coverWrap}>
        {store.coverUrl ? (
          <Image source={{ uri: store.coverUrl }} style={styles.cover} />
        ) : (
          <View style={styles.coverFallback}>
            <Image source={fallbackLogo} style={styles.coverFallbackLogo} resizeMode="contain" />
          </View>
        )}
      </View>

      <View style={styles.profileCard}>
        <View style={styles.logoWrap}>
          {store.logoUrl ? (
            <Image source={{ uri: store.logoUrl }} style={styles.logo} />
          ) : (
            <Image source={fallbackLogo} style={styles.logoFallback} resizeMode="contain" />
          )}
        </View>
        <View style={[styles.nameRow, isRtl && styles.nameRowRtl]}>
          <AppText style={[styles.storeName, textAlign]}>{storeName}</AppText>
          {store.trustBadgeApproved ? <VerifiedBadge size="md" /> : null}
        </View>
        {typeName ? (
          <View style={styles.typeBadge}>
            <AppText style={styles.typeBadgeText}>{typeName}</AppText>
          </View>
        ) : null}
        {storeBio ? <AppText style={[styles.bio, textAlign]}>{storeBio}</AppText> : null}

        <View style={styles.metaRow}>
          {cityLabel ? (
            <View style={styles.cityBadge}>
              <Ionicons name="location-outline" size={16} color={colors.brandDark} />
              <AppText style={styles.cityText}>{cityLabel}</AppText>
            </View>
          ) : null}
          {store.phone ? (
            <Pressable style={styles.phoneButton} onPress={() => Linking.openURL(`tel:${store.phone}`)}>
              <Ionicons name="call-outline" size={18} color={colors.brandDark} />
              <AppText style={[styles.phoneText, styles.ltr]}>
                {store.phone}
              </AppText>
            </Pressable>
          ) : null}
          <AppText style={[styles.listingsMeta, textAlign]}>
            {store.listingsCount ?? total} {text.listings}
          </AppText>
        </View>

        {store.owner ? (
          <View style={[styles.ownerRow, isRtl && styles.ownerRowRtl]}>
            {store.owner.avatar ? (
              <Image source={{ uri: store.owner.avatar }} style={styles.ownerAvatar} />
            ) : (
              <View style={styles.ownerAvatarFallback}>
                <AppText style={styles.ownerInitial}>{store.owner.fullName.slice(0, 1)}</AppText>
              </View>
            )}
            <AppText style={[styles.ownerName, textAlign]}>
              {text.owner}: {store.owner.fullName}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.listingsSection}>
        <View style={[styles.listingsHeader, isRtl && styles.listingsHeaderRtl]}>
          <AppText style={[styles.listingsTitle, textAlign]}>{text.storeListings}</AppText>
          <AppText style={styles.listingsCount}>
            {total.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')}
          </AppText>
        </View>

        {isLoadingListings && listings.length === 0 ? (
          <ActivityIndicator color={colors.brand} style={styles.listingsLoader} />
        ) : listings.length === 0 ? (
          <EmptyState message={text.noListings} />
        ) : (
          <View style={styles.listingsGrid}>
            {listings.map((listing) => (
              <View key={listing.id} style={styles.listingItem}>
                <ListingCard
                  listing={listing}
                  locale={locale}
                  featuredLabel={t.common.featured}
                  onPress={() => onListingPress(listing.id)}
                />
              </View>
            ))}
          </View>
        )}

        {isLoadingMore ? <ActivityIndicator color={colors.brand} style={styles.listingsLoader} /> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    backgroundColor: colors.background
  },
  coverWrap: {
    height: 180,
    backgroundColor: colors.brandSoft
  },
  cover: {
    width: '100%',
    height: '100%'
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  coverFallbackLogo: {
    width: 88,
    height: 88,
    opacity: 0.45
  },
  profileCard: {
    marginTop: -36,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
    ...shadow
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.brandSoft,
    marginBottom: 12
  },
  logo: {
    width: '100%',
    height: '100%'
  },
  logoFallback: {
    width: '100%',
    height: '100%',
    padding: 16
  },
  storeName: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  nameRowRtl: {
    flexDirection: 'row'
  },
  category: {
    color: colors.brandDark,
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 8
  },
  typeBadge: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderRadius: radius.pill,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  typeBadgeText: {
    color: '#047857',
    fontWeight: '800',
    fontSize: 12
  },
  bio: {
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 12,
    width: '100%'
  },
  metaRow: {
    width: '100%',
    gap: 10,
    marginBottom: 8
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  cityText: {
    fontWeight: '700',
    color: colors.ink,
    fontSize: 13
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  phoneText: {
    fontWeight: '800',
    color: colors.brandDark
  },
  listingsMeta: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    width: '100%'
  },
  ownerRowRtl: {
    flexDirection: 'row-reverse'
  },
  ownerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  ownerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ownerInitial: {
    fontWeight: '900',
    color: colors.ink
  },
  ownerName: {
    flex: 1,
    color: colors.muted,
    fontSize: 13
  },
  listingsSection: {
    padding: 16
  },
  listingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  listingsHeaderRtl: {
    flexDirection: 'row-reverse'
  },
  listingsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink
  },
  listingsCount: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13
  },
  listingsGrid: {
    gap: 12
  },
  listingItem: {
    width: '100%'
  },
  listingsLoader: {
    marginVertical: 16
  },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  ltr: { textAlign: 'left', writingDirection: 'ltr' }
});
