import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { CategoryChipsSkeleton } from './skeleton';
import { SectionTitle } from './SectionTitle';
import { useI18n } from '../i18n';
import { CategoryIcon } from '../lib/category-icons';
import type { CategoryOption } from '../services/listings.service';
import { useListingsStore } from '../stores';
import { colors, radius } from '../theme';

const getCategoryLabel = (category: CategoryOption, locale: 'ar' | 'en') =>
  (locale === 'ar' ? category.nameAr : category.nameEn) ?? category.name;

type CategoryChipProps = {
  label: string;
  icon?: string | null;
  adsCount: number;
  adsLabel: string;
  isRtl: boolean;
};

function CategoryChip({ label, icon, adsCount, adsLabel, isRtl }: CategoryChipProps) {
  return (
    <View style={styles.chip}>
      <View style={styles.iconWrap}>
        <CategoryIcon icon={icon} size={30} color={colors.brandDark} />
      </View>
      <AppText style={[styles.chipText, isRtl && styles.chipTextRtl]} numberOfLines={1}>
        {label}
      </AppText>
      <AppText style={[styles.chipMeta, isRtl && styles.chipTextRtl]}>
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

  return (
    <View style={styles.section}>
      <SectionTitle title={t.home.categories} />

      {isLoading && !hasLoadedCategories && rootCategories.length === 0 ? (
        <CategoryChipsSkeleton count={5} />
      ) : rootCategories.length === 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={isRtl ? styles.scrollRtl : undefined}
          contentContainerStyle={[styles.scrollContent, isRtl && styles.scrollContentRtl]}
        >
          {t.home.categoryNames.map((name) => (
            <CategoryChip key={name} label={name} adsCount={0} isRtl={isRtl} adsLabel={adsLabel} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={isRtl ? styles.scrollRtl : undefined}
          contentContainerStyle={[styles.scrollContent, isRtl && styles.scrollContentRtl]}
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
                adsCount={category._count?.ads ?? 0}
                adsLabel={adsLabel}
                isRtl={isRtl}
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
  loader: {
    alignSelf: 'flex-start',
    marginVertical: 8
  },
  scrollRtl: {
    direction: 'rtl'
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    paddingEnd: 4
  },
  scrollContentRtl: {
    flexDirection: 'row-reverse'
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
  chipTextRtl: {
    textAlign: 'center'
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
