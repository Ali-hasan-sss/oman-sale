import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollView as ScrollViewType
} from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { ErrorNotice } from '../components/ErrorNotice';
import { SuccessNotice } from '../components/SuccessNotice';
import { FormFieldsSkeleton } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { buildCategoryTree } from '../lib/category-tree';
import { omanCities } from '../lib/oman-cities';
import type { CategoryOption } from '../services/listings.service';
import {
  fetchPromotionPlans,
  formatPlanPrice,
  getPlanPrice,
  promoteAdRequest,
  type PromotionPlan
} from '../services/promotions.service';
import { useAuthStore, useListingsStore } from '../stores';
import { colors, radius, shadow } from '../theme';

const DESCRIPTION_MIN_FOR_PLANS = 10;
const DURATION_OPTIONS = [
  { days: 7, labelKey: 'oneWeek' as const },
  { days: 14, labelKey: 'twoWeeks' as const },
  { days: 30, labelKey: 'oneMonth' as const }
];

const getCategoryLabel = (category: CategoryOption, locale: 'ar' | 'en') =>
  (locale === 'ar' ? category.nameAr : category.nameEn) ?? category.name;

const alignChipScroll = (ref: React.RefObject<ScrollViewType | null>, isRtl: boolean) => {
  requestAnimationFrame(() => {
    if (isRtl) {
      ref.current?.scrollToEnd({ animated: false });
    } else {
      ref.current?.scrollTo({ x: 0, animated: false });
    }
  });
};

type AddOfferScreenProps = {
  onPublished?: () => void;
};

export function AddOfferScreen({ onPublished }: AddOfferScreenProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const categories = useListingsStore((state) => state.categories);
  const isLoading = useListingsStore((state) => state.isLoadingCategories);
  const hasLoadedCategories = useListingsStore((state) => state.hasLoadedCategories);
  const isSubmitting = useListingsStore((state) => state.isSubmittingListing);
  const loadCategories = useListingsStore((state) => state.loadCategories);
  const createListing = useListingsStore((state) => state.createListing);

  const categoryScrollRef = useRef<ScrollViewType>(null);
  const cityScrollRef = useRef<ScrollViewType>(null);
  const plansFetchStartedRef = useRef(false);

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState<string>(omanCities[0]!.value);

  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [duration, setDuration] = useState(7);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const descriptionReady = description.trim().length >= DESCRIPTION_MIN_FOR_PLANS;

  const categoryOptions = useMemo(() => {
    const tree = buildCategoryTree(categories);
    return tree.flatMap((parent) => {
      const parentLabel = getCategoryLabel(parent, locale);
      const entries = [{ id: parent.id, label: parentLabel, type: parent.type }];
      parent.children.forEach((child) => {
        const childLabel = getCategoryLabel(child, locale);
        entries.push({
          id: child.id,
          label: locale === 'ar' ? `${parentLabel} · ${childLabel}` : `${parentLabel} · ${childLabel}`,
          type: child.type
        });
      });
      return entries;
    });
  }, [categories, locale]);

  const selectedCategory = categoryOptions.find((item) => item.id === categoryId);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  useEffect(() => {
    loadCategories(locale, { refresh: useListingsStore.getState().hasLoadedCategories })
      .then(() => {
        const first = useListingsStore.getState().categories[0]?.id ?? '';
        setCategoryId((current) => current || first);
      })
      .catch(() => undefined);
  }, [locale, loadCategories]);

  useEffect(() => {
    alignChipScroll(categoryScrollRef, isRtl);
    alignChipScroll(cityScrollRef, isRtl);
  }, [isRtl, locale, categoryOptions.length]);

  useEffect(() => {
    plansFetchStartedRef.current = false;
    setPlans([]);
    setSelectedPlanId('');
    setPlansError(false);
  }, [locale]);

  useEffect(() => {
    if (!descriptionReady) {
      return;
    }

    if (plansFetchStartedRef.current) {
      return;
    }

    plansFetchStartedRef.current = true;
    setIsLoadingPlans(true);
    setPlansError(false);

    fetchPromotionPlans()
      .then((items) => {
        setPlans(items);
        setSelectedPlanId(items[0]?.id ?? '');
      })
      .catch(() => {
        setPlans([]);
        setPlansError(true);
      })
      .finally(() => setIsLoadingPlans(false));
  }, [descriptionReady, locale]);

  const submit = async () => {
    if (!accessToken || !selectedCategory) return;

    setSubmitError('');

    const result = await createListing({
      title: title.trim(),
      description: description.trim(),
      type: selectedCategory.type,
      price: Number(price.replaceAll(',', '')),
      city,
      categoryId: selectedCategory.id,
      imageUrls: []
    });

    if (!result.ok) {
      setSubmitError(t.addOffer.createError);
      return;
    }

    if (selectedPlan) {
      try {
        await promoteAdRequest({ adId: result.id, planId: selectedPlan.id, days: duration });
      } catch {
        setSubmitError(t.addOffer.createError);
        return;
      }
    }

    setPublishSuccess(true);
  };

  const handleSuccessAction = () => {
    setPublishSuccess(false);
    setTitle('');
    setDescription('');
    setPrice('');
    setPlans([]);
    setSelectedPlanId('');
    setSubmitError('');
    plansFetchStartedRef.current = false;
    onPublished?.();
  };

  const showSkeleton = isLoading && !hasLoadedCategories;
  const canSubmit =
    Boolean(selectedCategory) &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    price.trim().length > 0 &&
    city.length > 0 &&
    !isSubmitting;

  if (publishSuccess) {
    return (
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        <SuccessNotice
          title={t.addOffer.successTitle}
          message={t.addOffer.success}
          actionLabel={t.addOffer.viewMyOffers}
          onAction={handleSuccessAction}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      keyboardShouldPersistTaps="handled"
    >
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.title}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.subtitle}</AppText>

      {submitError ? <ErrorNotice message={submitError} onDismiss={() => setSubmitError('')} /> : null}

      {showSkeleton ? (
        <FormFieldsSkeleton rows={6} />
      ) : (
        <>
          <Field label={t.addOffer.titleField} isRtl={isRtl}>
            <AppTextInput
              value={title}
              onChangeText={setTitle}
              style={[styles.input, isRtl ? styles.inputRtl : styles.inputLtr]}
              placeholderTextColor={colors.muted}
            />
          </Field>

          <Field label={t.addOffer.category} isRtl={isRtl}>
            <ScrollView
              ref={categoryScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={isRtl ? styles.chipScrollRtl : styles.chipScrollLtr}
              contentContainerStyle={[styles.chipRow, isRtl && styles.chipRowRtl]}
            >
              {categoryOptions.map((category) => {
                const active = category.id === categoryId;
                return (
                  <Pressable
                    key={category.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategoryId(category.id)}
                  >
                    <AppText style={[styles.chipText, active && styles.chipTextActive, isRtl ? styles.chipRtl : styles.chipLtr]}>
                      {category.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Field>

          <Field label={t.addOffer.city} isRtl={isRtl}>
            <ScrollView
              ref={cityScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={isRtl ? styles.chipScrollRtl : styles.chipScrollLtr}
              contentContainerStyle={[styles.chipRow, isRtl && styles.chipRowRtl]}
            >
              {omanCities.map((cityOption) => {
                const active = cityOption.value === city;
                const label = locale === 'en' ? cityOption.en : cityOption.ar;
                return (
                  <Pressable
                    key={cityOption.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCity(cityOption.value)}
                  >
                    <AppText style={[styles.chipText, active && styles.chipTextActive, isRtl ? styles.chipRtl : styles.chipLtr]}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Field>

          <Field label={t.addOffer.price} isRtl={isRtl}>
            <AppTextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={[styles.input, isRtl ? styles.inputRtl : styles.inputLtr]}
              placeholderTextColor={colors.muted}
            />
          </Field>

          <Field label={t.addOffer.description} isRtl={isRtl}>
            <AppTextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, styles.textarea, isRtl ? styles.inputRtl : styles.inputLtr]}
              placeholderTextColor={colors.muted}
            />
          </Field>

          {descriptionReady ? (
            <View style={styles.promotionSection}>
              <AppText style={[styles.promotionTitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.adType}</AppText>
              <AppText style={[styles.promotionSubtitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.adTypeSubtitle}</AppText>

              {isLoadingPlans ? (
                <View style={styles.plansLoading}>
                  <ActivityIndicator color={colors.brand} />
                  <AppText style={styles.plansLoadingText}>{t.addOffer.promotionLoading}</AppText>
                </View>
              ) : plans.length === 0 ? (
                <AppText style={[styles.promotionEmpty, isRtl ? styles.rtl : styles.ltr]}>
                  {plansError ? t.addOffer.createError : t.addOffer.promotionPlansEmpty}
                </AppText>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={isRtl ? styles.chipScrollRtl : styles.chipScrollLtr}
                    contentContainerStyle={[styles.planRow, isRtl && styles.chipRowRtl]}
                  >
                    {plans.map((plan) => {
                      const active = plan.id === selectedPlanId;
                      const name = locale === 'en' ? plan.nameEn : plan.nameAr;
                      const planDescription = locale === 'en' ? plan.descriptionEn : plan.descriptionAr;
                      const planPrice = formatPlanPrice(getPlanPrice(plan, duration), locale, t.addOffer.free);

                      return (
                        <Pressable
                          key={plan.id}
                          style={[
                            styles.planCard,
                            active && styles.planCardActive,
                            plan.color ? { borderColor: plan.color } : null
                          ]}
                          onPress={() => setSelectedPlanId(plan.id)}
                        >
                          {active ? (
                            <View style={styles.planCheck}>
                              <Ionicons name="checkmark" size={14} color="#fff" />
                            </View>
                          ) : null}
                          <View style={[styles.planHeader, isRtl && styles.planHeaderRtl]}>
                            <AppText style={[styles.planName, isRtl ? styles.rtl : styles.ltr]} numberOfLines={1}>
                              {name}
                            </AppText>
                            {plan.badgeLabel ? (
                              <View style={[styles.planBadge, { backgroundColor: plan.color ?? colors.brand }]}>
                                <AppText style={styles.planBadgeText}>{plan.badgeLabel}</AppText>
                              </View>
                            ) : null}
                          </View>
                          <AppText style={[styles.planDescription, isRtl ? styles.rtl : styles.ltr]} numberOfLines={2}>
                            {planDescription}
                          </AppText>
                          <AppText style={[styles.planPrice, active && styles.planPriceActive]}>{planPrice}</AppText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {selectedPlan ? (
                    <View style={styles.durationBlock}>
                      <AppText style={[styles.durationLabel, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.duration}</AppText>
                      <View style={[styles.durationRow, isRtl && styles.durationRowRtl]}>
                        {DURATION_OPTIONS.map((option) => {
                          const active = duration === option.days;
                          const label = t.addOffer[option.labelKey];
                          const optionPrice = selectedPlan
                            ? formatPlanPrice(getPlanPrice(selectedPlan, option.days), locale, t.addOffer.free)
                            : '';

                          return (
                            <Pressable
                              key={option.days}
                              style={[styles.durationChip, active && styles.durationChipActive]}
                              onPress={() => setDuration(option.days)}
                            >
                              {active ? (
                                <View style={styles.durationCheck}>
                                  <Ionicons name="checkmark" size={12} color="#fff" />
                                </View>
                              ) : null}
                              <AppText style={[styles.durationChipLabel, active && styles.durationChipLabelActive]}>
                                {label}
                              </AppText>
                              {optionPrice ? (
                                <AppText style={[styles.durationChipPrice, active && styles.durationChipPriceActive]}>
                                  {optionPrice}
                                </AppText>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          ) : (
            <AppText style={[styles.promotionHint, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.promotionHint}</AppText>
          )}

          <Pressable style={[styles.submit, !canSubmit && styles.submitDisabled]} onPress={submit} disabled={!canSubmit}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText style={styles.submitText}>{t.addOffer.publish}</AppText>
            )}
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function Field({ label, children, isRtl }: { label: string; children: ReactNode; isRtl?: boolean }) {
  return (
    <View style={styles.field}>
      <AppText style={[styles.label, isRtl ? styles.rtl : styles.ltr]}>{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
    marginBottom: 16
  },
  field: {
    marginBottom: 14
  },
  label: {
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink
  },
  inputRtl: {
    textAlign: 'right'
  },
  inputLtr: {
    textAlign: 'left'
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top'
  },
  chipScrollLtr: {
    direction: 'ltr',
    alignSelf: 'flex-start'
  },
  chipScrollRtl: {
    direction: 'rtl',
    alignSelf: 'flex-end'
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2
  },
  chipRowRtl: {
    flexDirection: 'row-reverse'
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand
  },
  chipText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13
  },
  chipTextActive: {
    color: colors.brandDark
  },
  chipRtl: {
    textAlign: 'right'
  },
  chipLtr: {
    textAlign: 'left'
  },
  promotionHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line
  },
  promotionSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink
  },
  promotionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12
  },
  promotionEmpty: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  plansLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12
  },
  plansLoadingText: {
    color: colors.muted,
    fontWeight: '600'
  },
  planRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4
  },
  planCard: {
    width: 168,
    minHeight: 130,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.background,
    padding: 12
  },
  planCardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft
  },
  planCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingEnd: 24
  },
  planHeaderRtl: {
    flexDirection: 'row-reverse'
  },
  planName: {
    flex: 1,
    fontWeight: '800',
    fontSize: 14,
    color: colors.ink
  },
  planBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  planBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800'
  },
  planDescription: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 8
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink
  },
  planPriceActive: {
    fontSize: 18,
    color: colors.brandDark
  },
  durationBlock: {
    marginTop: 14
  },
  durationLabel: {
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  durationRowRtl: {
    flexDirection: 'row-reverse'
  },
  durationChip: {
    flex: 1,
    minWidth: '30%',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.background,
    padding: 12,
    alignItems: 'center'
  },
  durationChipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft
  },
  durationCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center'
  },
  durationChipLabel: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center'
  },
  durationChipLabelActive: {
    color: colors.brandDark
  },
  durationChipPrice: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted
  },
  durationChipPriceActive: {
    color: colors.brandDark
  },
  submit: {
    marginTop: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center'
  },
  submitDisabled: {
    opacity: 0.65
  },
  submitText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
