import { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { HeroBannersSection } from '../components/HeroBannersSection';
import { HomeCategoriesSection } from '../components/HomeCategoriesSection';
import { HomeHeroSection } from '../components/HomeHeroSection';
import { ListingCard } from '../components/ListingCard';
import { SectionTitle } from '../components/SectionTitle';
import { ListingCardSkeletonRow } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { useListingsStore } from '../stores';
import { colors } from '../theme';

type HomeScreenProps = {
  onBrowseOffers: () => void;
  onListingPress: (listingId: string) => void;
  onCategoryPress: (categoryId: string) => void;
};

export function HomeScreen({ onBrowseOffers, onListingPress, onCategoryPress }: HomeScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const listings = useListingsStore((state) => state.latest);
  const isLoading = useListingsStore((state) => state.isLoadingLatest);
  const isLoadingMore = useListingsStore((state) => state.isLoadingMoreLatest);
  const isRefreshing = useListingsStore((state) => state.isRefreshingLatest);
  const hasLoadedLatest = useListingsStore((state) => state.hasLoadedLatest);
  const loadLatest = useListingsStore((state) => state.loadLatest);
  const loadMoreLatest = useListingsStore((state) => state.loadMoreLatest);

  useEffect(() => {
    loadLatest({ refresh: useListingsStore.getState().hasLoadedLatest }).catch(() => undefined);
  }, [locale, loadLatest]);

  const handleRefresh = useCallback(() => {
    loadLatest({ refresh: true }).catch(() => undefined);
  }, [loadLatest]);

  const handleLoadMore = useCallback(() => {
    loadMoreLatest().catch(() => undefined);
  }, [loadMoreLatest]);

  const showLatestSkeleton = isLoading && !hasLoadedLatest;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.brand]}
          tintColor={colors.brand}
        />
      }
    >
      <HomeHeroSection onBrowseOffers={onBrowseOffers} />
      <HeroBannersSection />

      <HomeCategoriesSection onCategoryPress={onCategoryPress} />

      <View style={styles.section}>
        <SectionTitle title={t.home.latest} actionLabel={t.common.viewAll} onAction={onBrowseOffers} />
        {showLatestSkeleton ? (
          <ListingCardSkeletonRow count={3} layout="horizontal" />
        ) : (
          <FlatList
            horizontal
            nestedScrollEnabled
            data={listings}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            style={isRtl ? styles.latestScrollRtl : undefined}
            contentContainerStyle={[styles.latestScroll, isRtl && styles.latestScrollContentRtl]}
            renderItem={({ item }) => (
              <ListingCard
                listing={item}
                locale={locale}
                featuredLabel={t.common.featured}
                layout="horizontal"
                onPress={() => onListingPress(item.id)}
              />
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator color={colors.brand} style={styles.latestMoreLoader} />
              ) : null
            }
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {},
  section: {
    paddingHorizontal: 16,
    marginBottom: 10
  },
  latestMoreLoader: {
    marginVertical: 24,
    marginHorizontal: 12
  },
  latestScrollRtl: {
    direction: 'rtl'
  },
  latestScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingEnd: 4,
    paddingBottom: 4
  },
  latestScrollContentRtl: {
    flexDirection: 'row-reverse'
  }
});
