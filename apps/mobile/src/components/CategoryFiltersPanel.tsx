import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { AppTextInput } from './AppTextInput';
import { Skeleton } from './skeleton';
import { omanCities } from '../lib/oman-cities';
import type { CategoryFilter, CategoryOption } from '../services/listings.service';
import { colors, radius, shadow } from '../theme';

export type CategoryFiltersDraft = {
  search: string;
  subcategoryId: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  filterOptionIds: string[];
};

type CategoryFiltersMessages = {
  filters: string;
  clearAll: string;
  subcategories: string;
  all: string;
  selectCity: string;
  priceRange: string;
  minPrice: string;
  maxPrice: string;
  applyFilters: string;
  resetFilters: string;
  expand: string;
  collapse: string;
};

type CategoryFiltersPanelProps = {
  expanded: boolean;
  onToggleExpanded: () => void;
  locale: 'ar' | 'en';
  isRtl: boolean;
  messages: CategoryFiltersMessages;
  subcategories: CategoryOption[];
  categoryFilters: CategoryFilter[];
  isLoadingFilters: boolean;
  draft: CategoryFiltersDraft;
  onDraftChange: (patch: Partial<CategoryFiltersDraft>) => void;
  onToggleFilterOption: (optionId: string) => void;
  onApply: () => void;
  onReset: () => void;
  activeFilterCount: number;
};

const getCategoryLabel = (category: CategoryOption, locale: 'ar' | 'en') =>
  (locale === 'ar' ? category.nameAr : category.nameEn) ?? category.name;

function FilterSection({
  title,
  children,
  defaultOpen = false,
  isRtl = false
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  isRtl?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.filterSection}>
      <Pressable
        style={[styles.filterSectionHeader, isRtl && styles.filterSectionHeaderRtl]}
        onPress={() => setOpen((current) => !current)}
      >
        <AppText style={[styles.filterSectionTitle, isRtl && styles.rtl]}>{title}</AppText>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {open ? <View style={[styles.chipWrap, isRtl && styles.chipWrapRtl]}>{children}</View> : null}
    </View>
  );
}

function FilterChip({
  active,
  label,
  onPress
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed
      ]}
    >
      <AppText style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</AppText>
    </Pressable>
  );
}

export function CategoryFiltersPanel({
  expanded,
  onToggleExpanded,
  locale,
  isRtl,
  messages,
  subcategories,
  categoryFilters,
  isLoadingFilters,
  draft,
  onDraftChange,
  onToggleFilterOption,
  onApply,
  onReset,
  activeFilterCount
}: CategoryFiltersPanelProps) {
  return (
    <View style={styles.panel}>
      <Pressable style={styles.panelHeader} onPress={onToggleExpanded}>
        <View style={styles.panelHeaderStart}>
          <Ionicons name="options-outline" size={20} color={colors.brandDark} />
          <AppText style={styles.panelTitle}>{messages.filters}</AppText>
          {activeFilterCount > 0 ? (
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>{activeFilterCount}</AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.panelHeaderEnd}>
          <AppText style={styles.expandHint}>{expanded ? messages.collapse : messages.expand}</AppText>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.panelBody}>
          <AppTextInput
            value={draft.search}
            onChangeText={(search) => onDraftChange({ search })}
            placeholder={locale === 'ar' ? 'ابحث في العروض...' : 'Search listings...'}
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, isRtl ? styles.inputRtl : styles.inputLtr]}
          />

          {isLoadingFilters ? (
            <View style={styles.filtersLoading}>
              <ActivityIndicator color={colors.brand} />
              <Skeleton width="100%" height={36} borderRadius={radius.md} style={styles.filtersLoadingGap} />
              <Skeleton width="80%" height={36} borderRadius={radius.md} />
            </View>
          ) : (
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.filtersScroll}>
              {subcategories.length > 0 ? (
                <FilterSection title={messages.subcategories} defaultOpen isRtl={isRtl}>
                  <FilterChip
                    active={!draft.subcategoryId}
                    label={messages.all}
                    onPress={() => onDraftChange({ subcategoryId: '' })}
                  />
                  {subcategories.map((category) => (
                    <FilterChip
                      key={category.id}
                      active={draft.subcategoryId === category.id}
                      label={getCategoryLabel(category, locale)}
                      onPress={() =>
                        onDraftChange({
                          subcategoryId: draft.subcategoryId === category.id ? '' : category.id
                        })
                      }
                    />
                  ))}
                </FilterSection>
              ) : null}

              {categoryFilters.map((filter) => (
                <FilterSection key={filter.id} title={filter.title} isRtl={isRtl}>
                  {filter.options.map((option) => (
                    <FilterChip
                      key={option.id}
                      active={draft.filterOptionIds.includes(option.id)}
                      label={option.label}
                      onPress={() => onToggleFilterOption(option.id)}
                    />
                  ))}
                </FilterSection>
              ))}

              <FilterSection title={messages.selectCity} isRtl={isRtl}>
                {omanCities.map((cityOption) => (
                  <FilterChip
                    key={cityOption.value}
                    active={draft.city === cityOption.value}
                    label={locale === 'en' ? cityOption.en : cityOption.ar}
                    onPress={() =>
                      onDraftChange({
                        city: draft.city === cityOption.value ? '' : cityOption.value
                      })
                    }
                  />
                ))}
              </FilterSection>

              <FilterSection title={messages.priceRange} isRtl={isRtl}>
                <View style={[styles.priceRow, isRtl && styles.priceRowRtl]}>
                  <AppTextInput
                    value={draft.minPrice}
                    onChangeText={(minPrice) => onDraftChange({ minPrice })}
                    placeholder={messages.minPrice}
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    style={[styles.priceInput, isRtl ? styles.inputRtl : styles.inputLtr]}
                  />
                  <AppText style={styles.priceDash}>-</AppText>
                  <AppTextInput
                    value={draft.maxPrice}
                    onChangeText={(maxPrice) => onDraftChange({ maxPrice })}
                    placeholder={messages.maxPrice}
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    style={[styles.priceInput, isRtl ? styles.inputRtl : styles.inputLtr]}
                  />
                </View>
              </FilterSection>
            </ScrollView>
          )}

          <View style={[styles.actions, isRtl && styles.actionsRtl]}>
            <Pressable style={styles.applyButton} onPress={onApply}>
              <AppText style={styles.applyButtonText}>{messages.applyFilters}</AppText>
            </Pressable>
            <Pressable style={styles.resetButton} onPress={onReset}>
              <AppText style={styles.resetButtonText}>{messages.resetFilters}</AppText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadow
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  panelHeaderStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  panelHeaderEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink
  },
  expandHint: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600'
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800'
  },
  panelBody: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 14,
    paddingBottom: 14
  },
  searchInput: {
    marginTop: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  filtersScroll: {
    maxHeight: 280,
    marginTop: 8
  },
  filtersLoading: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  filtersLoadingGap: {
    marginTop: 10
  },
  filterSection: {
    marginTop: 10
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  filterSectionHeaderRtl: {
    flexDirection: 'row-reverse'
  },
  rtl: {
    textAlign: 'right'
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start'
  },
  chipWrapRtl: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end'
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  chipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft
  },
  chipPressed: {
    opacity: 0.9
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink
  },
  chipLabelActive: {
    color: colors.brandDark,
    fontWeight: '800'
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%'
  },
  priceRowRtl: {
    flexDirection: 'row-reverse'
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  priceDash: {
    color: colors.muted,
    fontWeight: '700'
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  actionsRtl: {
    flexDirection: 'row-reverse'
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center'
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14
  },
  resetButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center'
  },
  resetButtonText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 13
  },
  inputRtl: {
    textAlign: 'right'
  },
  inputLtr: {
    textAlign: 'left'
  }
});
