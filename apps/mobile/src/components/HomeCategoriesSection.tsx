import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from './AppText';
import { CategoryChipsSkeleton } from './skeleton';
import { useI18n } from '../i18n';
import { CategoryIcon } from '../lib/category-icons';
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
  const { locale, t } = useI18n();
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
      <AppText style={styles.title}>{t.home.categoriesTitle}</AppText>
      <AppText style={styles.subtitle}>{t.home.categoriesSubtitle}</AppText>

      {showSkeleton ? (
        <CategoryChipsSkeleton count={4} />
      ) : (
        <View style={styles.grid}>
          {rootCategories.map((category, index) => {
            const tone = pastel[index % pastel.length]!;
            return (
              <Pressable
                key={category.id}
                style={[styles.card, { backgroundColor: tone.bg, width: cardWidth }]}
                onPress={() => onCategoryPress?.(category.id)}
              >
                <CategoryIcon icon={category.icon} iconImageUrl={category.iconImageUrl} size={36} color={tone.fg} />
                <AppText style={styles.cardTitle} numberOfLines={2}>
                  {getCategoryLabel(category, locale)}
                </AppText>
                <AppText style={styles.cardMeta}>
                  {category._count?.ads ?? 0} {t.home.adCount}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}

      {onBrowseOffers ? (
        <Pressable style={styles.cta} onPress={onBrowseOffers}>
          <AppText style={styles.ctaText}>{t.common.allListings}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 8
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    textAlign: 'center',
    color: '#475569',
    fontSize: 15
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  card: {
    minHeight: 148,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 18
  },
  cardTitle: {
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '800',
    color: colors.ink,
    fontSize: 15
  },
  cardMeta: {
    marginTop: 4,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 13
  },
  cta: {
    alignSelf: 'center',
    marginTop: 18,
    backgroundColor: '#168c4e',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12
  },
  ctaText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15
  }
});
