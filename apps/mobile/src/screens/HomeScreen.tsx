import { useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { HeroBannersSection } from '../components/HeroBannersSection';
import { HomeArticlesSection } from '../components/HomeArticlesSection';
import { HomeCategoriesSection } from '../components/HomeCategoriesSection';
import { HomeCategoryBar } from '../components/HomeCategoryBar';
import { HomeCreateStoreBanner } from '../components/HomeCreateStoreBanner';
import { HomeHeroSection } from '../components/HomeHeroSection';
import { HomeTourismSection } from '../components/HomeTourismSection';
import { HomeWhySection } from '../components/HomeWhySection';
import { ListingCard } from '../components/ListingCard';
import { SectionTitle } from '../components/SectionTitle';
import { ListingListSkeleton } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { useListingsStore } from '../stores';
import { colors } from '../theme';

type HomeScreenProps = {
  onBrowseOffers: () => void;
  onListingPress: (listingId: string) => void;
  onCategoryPress: (categoryId: string) => void;
  onCreateStore: () => void;
  onBrowseNews: () => void;
  onArticlePress: (slug: string) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenRefund: () => void;
  onStorePress: (slug: string) => void;
};

export function HomeScreen({
  onBrowseOffers,
  onListingPress,
  onCategoryPress,
  onCreateStore,
  onBrowseNews,
  onArticlePress,
  onOpenTerms,
  onOpenPrivacy,
  onOpenRefund,
  onStorePress
}: HomeScreenProps) {
  const { locale, t } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const listings = useListingsStore((state) => state.latest);
  const isLoading = useListingsStore((state) => state.isLoadingLatest);
  const isRefreshing = useListingsStore((state) => state.isRefreshingLatest);
  const hasLoadedLatest = useListingsStore((state) => state.hasLoadedLatest);
  const loadLatest = useListingsStore((state) => state.loadLatest);

  useEffect(() => {
    const { hasLoadedLatest } = useListingsStore.getState();
    loadLatest({ refresh: hasLoadedLatest }).catch(() => undefined);
  }, [locale, loadLatest]);

  const handleRefresh = useCallback(() => {
    loadLatest({ refresh: true }).catch(() => undefined);
  }, [loadLatest]);

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
      <HomeCategoryBar onCategoryPress={onCategoryPress} />
      <HeroBannersSection />
      <HomeCreateStoreBanner onCreateStore={onCreateStore} />
      <HomeCategoriesSection onCategoryPress={onCategoryPress} onBrowseOffers={onBrowseOffers} />
      <HeroBannersSection placement="HOME_BELOW_CATEGORIES" />

      <View style={styles.section}>
        <SectionTitle title={t.home.latest} actionLabel={t.common.viewAll} onAction={onBrowseOffers} />
        {showLatestSkeleton ? (
          <ListingListSkeleton count={3} />
        ) : listings.length === 0 ? (
          <EmptyState message={t.offers.empty} />
        ) : (
          listings.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              locale={locale}
              featuredLabel={t.common.featured}
              layout="vertical"
              onPress={() => onListingPress(item.id)}
              onStorePress={onStorePress}
            />
          ))
        )}
      </View>

      <HomeArticlesSection onOpenArticle={onArticlePress} onBrowseNews={onBrowseNews} />
      <HeroBannersSection placement="HOME_BELOW_ARTICLES" />
      <HomeTourismSection />
      <HomeWhySection
        onBrowseNews={onBrowseNews}
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
        onOpenRefund={onOpenRefund}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: '#f8fafc'
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 18
  }
});
