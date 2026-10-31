import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from './AppText';
import { CategoryChipsSkeleton } from './skeleton';
import { SectionHeader } from './vertex/SectionHeader';
import { useI18n } from '../i18n';
import { CategoryIcon } from '../lib/category-icons';
import { insetEnd, rowDirection } from '../lib/layout-direction';
import type { CategoryOption } from '../services/listings.service';
import { useListingsStore } from '../stores';
import { colors, radius } from '../theme';

const pastel = [
  { bg: '#fefce8', fg: '#ca8a04' },
  { bg: '#fdf2f8', fg: '#db2777' },
  { bg: '#eff6ff', fg: '#2563eb' },
  { bg: '#f0fdf4', fg: '#16a34a' },
  { bg: '#eef2ff', fg: '#4f46e5' },
  { bg: '#ecfdf5', fg: '#059669' },
  { bg: '#f0fdfa', fg: '#0d9488' },
  { bg: '#fef2f2', fg: '#dc2626' },
  { bg: '#fff7ed', fg: '#ea580c' },
  { bg: '#faf5ff', fg: '#9333ea' }
];

const getCategoryLabel = (category: CategoryOption, locale: 'ar' | 'en') =>
  (locale === 'ar' ? category.nameAr : category.nameEn) ?? category.name;

type HomeCategoriesSectionProps = {
  onCategoryPress?: (categoryId: string) => void;
  onBrowseOffers?: () => void;
};

export function HomeCategoriesSection({ onCategoryPress, onBrowseOffers }: HomeCategoriesSectionProps) {
  const { locale, isRtl, t } = useI18n();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 32 - 12) / 2;
  const categories = useListingsStore((state) => state.categories);
  const isLoading = useListingsStore((state) => state.isLoadingCategories);
  const hasLoadedCategories = useListingsStore((state) => state.hasLoadedCategories);
  const loadCategories = useListingsStore((state) => state.loadCategories);

  useEffect(() => {
    loadCategories(locale, { refresh: useListingsStore.getState().hasLoadedCategories }).catch(() => undefined);
  }, [locale, loadCategories]);

  const rootCategories = useMemo(
    () =>
      (categories ?? [])
        .filter((category) => !category.parentId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  const showSkeleton = isLoading && !hasLoadedCategories && rootCategories.length === 0;
  if (!showSkeleton && rootCategories.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t.home.categoriesTitle}
        subtitle={t.home.categoriesSubtitle}
        actionLabel={onBrowseOffers ? (locale === 'ar' ? 'كل الفئات' : 'All categories') : undefined}
        onAction={onBrowseOffers}
      />

      {showSkeleton ? (
        <CategoryChipsSkeleton count={4} />
      ) : (
        <View style={[styles.grid, rowDirection(isRtl)]}>
          {rootCategories.map((category, index) => {
            const tone = pastel[index % pastel.length]!;
            return (
              <Pressable
                key={category.id}
                style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.cardPressed]}
                onPress={() => onCategoryPress?.(category.id)}
              >
                <LinearGradient
                  colors={['#ffffff', '#ffffff', '#f0fdf4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <AppText style={styles.cardTitle} numberOfLines={2}>
                  {getCategoryLabel(category, locale)}
                </AppText>
                <AppText style={styles.cardMeta}>
                  {category._count?.ads ?? 0} {t.home.adCount}
                </AppText>
                <View style={[styles.icon, insetEnd(isRtl, 14)]}>
                  <CategoryIcon icon={category.icon} iconImageUrl={category.iconImageUrl} size={56} color={tone.fg} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
    marginBottom: 8
  },
  grid: {
    flexWrap: 'wrap',
    gap: 12
  },
  card: {
    height: 150,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    padding: 14,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }]
  },
  cardTitle: {
    fontWeight: '900',
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22
  },
  cardMeta: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12
  },
  icon: {
    position: 'absolute',
    bottom: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 8 }
  }
});
