import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { HeroBannersSection } from '../components/HeroBannersSection';
import { HomeHeroSection } from '../components/HomeHeroSection';
import { ListingCard } from '../components/ListingCard';
import { SectionTitle } from '../components/SectionTitle';
import { AppText } from '../components/AppText';
import { useI18n } from '../i18n';
import { useListingsStore } from '../stores';
import { colors, radius } from '../theme';

type HomeScreenProps = {
  onBrowseOffers: () => void;
};

export function HomeScreen({ onBrowseOffers }: HomeScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const listings = useListingsStore((state) => state.latest);
  const isLoading = useListingsStore((state) => state.isLoadingLatest);
  const loadLatest = useListingsStore((state) => state.loadLatest);

  useEffect(() => {
    loadLatest(8).catch(() => undefined);
  }, [locale, loadLatest]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <HomeHeroSection onBrowseOffers={onBrowseOffers} />
      <HeroBannersSection />

      <View style={styles.section}>
        <SectionTitle title={t.home.categories} />
        <View style={[styles.chips, isRtl && styles.chipsRtl]}>
          {t.home.categoryNames.map((name) => (
            <View key={name} style={styles.chip}>
              <AppText style={[styles.chipText, isRtl && styles.chipTextRtl]}>{name}</AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title={t.home.latest} actionLabel={t.common.viewAll} onAction={onBrowseOffers} />
        {isLoading ? (
          <ActivityIndicator color={colors.brand} />
        ) : (
          listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} featuredLabel={t.common.featured} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 10
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start'
  },
  chipsRtl: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end'
  },
  chip: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  chipText: {
    color: colors.brandDark,
    fontWeight: '800'
  },
  chipTextRtl: {
    textAlign: 'right'
  }
});
