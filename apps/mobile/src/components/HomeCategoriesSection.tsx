import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { CategoryChipsSkeleton } from './skeleton';
import { SectionTitle } from './SectionTitle';
import { useI18n } from '../i18n';
import { rowDirection } from '../lib/layout-direction';
import { CategoryIcon } from '../lib/category-icons';
import type { CategoryOption } from '../services/listings.service';
import { useListingsStore } from '../stores';
import { colors, radius } from '../theme';

const getCategoryLabel = (category: CategoryOption, locale: 'ar' | 'en') =>
  (locale === 'ar' ? category.nameAr : category.nameEn) ?? category.name;

type CategoryChipProps = {
  label: string;
  icon?: string | null;
  iconImageUrl?: string | null;
  adsCount: number;
  adsLabel: string;
};

function CategoryChip({ label, icon, iconImageUrl, adsCount, adsLabel }: CategoryChipProps) {
  return (
    <View style={styles.chip}>
      <View style={styles.iconWrap}>
        <CategoryIcon icon={icon} iconImageUrl={iconImageUrl} size={30} color={colors.brandDark} />
      </View>
      <AppText style={styles.chipText} numberOfLines={1}>
        {label}
      </AppText>
      <AppText style={styles.chipMeta}>
        {adsCount} {adsLabel}
      </AppText>
    </View>
  );
}

type HomeCategoriesSectionProps = {
  onCategoryPress?: (categoryId: string) => void;
};

export function HomeCategoriesSection({ onCategoryPress }: HomeCategoriesSectionProps) {
  const { locale, t, isRtl } = useI18n();
  const categories = useListingsStore((state) => state.categories);
  const isLoading = useListingsStore((state) => state.isLoadingCategories);
  const hasLoadedCategories = useListingsStore((state) => state.hasLoadedCategories);
  const loadCategories = useListingsStore((state) => state.loadCategories);

  const adsLabel = locale === 'ar' ? 'إعلان' : 'ads';

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

  if (!showSkeleton && rootCategories.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionTitle title={t.home.categories} />

      {showSkeleton ? (
        <CategoryChipsSkeleton count={5} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, rowDirection(isRtl)]}
        >
          {rootCategories.map((category) => (
            <Pressable
              key={category.id}
              style={({ pressed }) => [pressed && styles.chipPressed]}
              accessibilityRole="button"
              onPress={() => onCategoryPress?.(category.id)}
            >
              <CategoryChip
                label={getCategoryLabel(category, locale)}
                icon={category.icon}
                iconImageUrl={category.iconImageUrl}
                adsCount={category._count?.ads ?? 0}
                adsLabel={adsLabel}
              />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 10
  },
  scrollContent: {
    alignItems: 'stretch',
    gap: 10,
    paddingEnd: 4
  },
  chip: {
    width: 140,
    minHeight: 118,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: colors.brandSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(15, 159, 103, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 12
  },
  chipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }]
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  chipText: {
    width: '100%',
    color: colors.brandDark,
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18
  },
  chipMeta: {
    marginTop: 6,
    minHeight: 16,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center'
  }
});
