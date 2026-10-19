import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { CategoryIcon } from '../lib/category-icons';
import { useI18n } from '../i18n';
import type { CategoryOption } from '../services/listings.service';
import { useListingsStore } from '../stores';
import { colors } from '../theme';

const getCategoryLabel = (category: CategoryOption, locale: 'ar' | 'en') =>
  (locale === 'ar' ? category.nameAr : category.nameEn) ?? category.name;

type HomeCategoryBarProps = {
  onCategoryPress: (categoryId: string) => void;
};

export function HomeCategoryBar({ onCategoryPress }: HomeCategoryBarProps) {
  const { locale } = useI18n();
  const categories = useListingsStore((state) => state.categories);
  const loadCategories = useListingsStore((state) => state.loadCategories);

  useEffect(() => {
    loadCategories(locale, { refresh: useListingsStore.getState().hasLoadedCategories }).catch(() => undefined);
  }, [locale, loadCategories]);

  const roots = useMemo(
    () =>
      (categories ?? [])
        .filter((category) => !category.parentId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  if (roots.length === 0) return null;

  return (
    <View style={styles.bar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {roots.map((category) => (
          <Pressable key={category.id} style={styles.item} onPress={() => onCategoryPress(category.id)}>
            <CategoryIcon icon={category.icon} iconImageUrl={category.iconImageUrl} size={20} color={colors.ink} />
            <AppText style={styles.label}>{getCategoryLabel(category, locale)}</AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  row: {
    alignItems: 'stretch'
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderEndWidth: 1,
    borderEndColor: '#e2e8f0'
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  }
});
