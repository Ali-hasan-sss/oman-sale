import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollView as ScrollViewType
} from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { ErrorNotice } from '../components/ErrorNotice';
import { SuccessNotice } from '../components/SuccessNotice';
import { FormFieldsSkeleton } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { buildCategoryTree, flattenCategoryTreeWithPath } from '../lib/category-tree';
import { getValidationFieldErrors, resolveApiErrorMessage } from '../lib/api-errors';
import {
  parseListingPrice,
  sanitizePriceInput,
  validateListingForm
} from '../lib/listing-form-validation';
import { omanCities } from '../lib/oman-cities';
import type { CategoryOption } from '../services/listings.service';
import {
  fetchPromotionPlans,
  formatPlanPrice,
  getPlanPrice,
  promoteAdRequest,
  sortPromotionPlansByPrice,
  type PromotionPlan
} from '../services/promotions.service';
import { fetchMyStores, type OwnerStore } from '../services/stores.service';
import { useAuthStore, useListingsStore } from '../stores';
import { colors, radius, shadow } from '../theme';

const DESCRIPTION_MIN_FOR_PLANS = 10;
const DURATION_OPTIONS = [
  { days: 7, labelKey: 'oneWeek' as const },
  { days: 14, labelKey: 'twoWeeks' as const },
  { days: 30, labelKey: 'oneMonth' as const }
] as const;

type AddOfferScreenProps = {
  onPublished?: () => void;
};

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
  const scrollViewRef = useRef<ScrollViewType>(null);
  const errorBannerRef = useRef<View>(null);
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
  const [ownerStore, setOwnerStore] = useState<OwnerStore | null>(null);
  const [publishSource, setPublishSource] = useState<'store' | 'personal'>('personal');
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validationMessages = useMemo(
    () => ({
      titleRequired: t.errors.fieldTitleRequired,
      titleMin: t.errors.fieldTitleMin,
      descriptionRequired: t.errors.fieldDescriptionRequired,
      descriptionMin: t.errors.fieldDescriptionMin,
      categoryRequired: t.errors.fieldCategoryRequired,
      cityRequired: t.errors.fieldCityRequired,
      priceRequired: t.errors.fieldPriceRequired,
      priceInvalid: t.errors.fieldPriceInvalid
    }),
    [t.errors]
  );

  const scrollToErrors = useCallback(() => {
    Keyboard.dismiss();

    const runScroll = () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(runScroll);
    });
    setTimeout(runScroll, 180);
    setTimeout(runScroll, 360);
  }, []);

  useEffect(() => {
    if (submitError) scrollToErrors();
  }, [submitError, scrollToErrors]);

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const descriptionReady = description.trim().length >= DESCRIPTION_MIN_FOR_PLANS;

  const categoryOptions = useMemo(() => {
    const tree = buildCategoryTree(categories);
    return flattenCategoryTreeWithPath(tree, (category) => getCategoryLabel(category, locale));
  }, [categories, locale]);

  const selectedCategory = categories.find((item) => item.id === categoryId);
  const displayPlans = useMemo(
    () => sortPromotionPlansByPrice(plans, duration),
    [plans, duration]
  );
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
  const canPublishFromStore = Boolean(
    ownerStore &&
      ownerStore.isActive &&
      (ownerStore.accessStatus === 'ACTIVE' || ownerStore.accessStatus === 'TRIAL')
  );
  const isStorePublish = canPublishFromStore && publishSource === 'store';

  useEffect(() => {
    if (!accessToken) return;
    fetchMyStores()
      .then((stores) => {
        const activeStore = stores.find(
          (store) =>
            store.isActive && (store.accessStatus === 'ACTIVE' || store.accessStatus === 'TRIAL')
        );
        setOwnerStore(activeStore ?? stores[0] ?? null);
        if (activeStore) setPublishSource('store');
      })
      .catch(() => setOwnerStore(null));
  }, [accessToken]);

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
        const sorted = sortPromotionPlansByPrice(items, duration);
        setPlans(items);
        setSelectedPlanId(sorted[0]?.id ?? '');
      })
      .catch(() => {
        setPlans([]);
        setPlansError(true);
      })
      .finally(() => setIsLoadingPlans(false));
  }, [descriptionReady, locale]);

  const submit = async () => {
    const nextFieldErrors = validateListingForm(
      { title, description, categoryId, city, price },
      validationMessages
    );

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitError(t.errors.VALIDATION_FAILED);
      return;
    }

    if (!accessToken || !selectedCategory) return;

    setSubmitError('');
    setFieldErrors({});

    const result = await createListing({
      title: title.trim(),
      description: description.trim(),
      type: selectedCategory.type,
      price: parseListingPrice(price),
      city,
      categoryId: selectedCategory.id,
      imageUrls: [],
      ...(isStorePublish && ownerStore ? { storeId: ownerStore.id } : {})
    });

    if (!result.ok) {
      const apiFieldErrors = getValidationFieldErrors(result.apiError, t.errors);
      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors);
      }
      setSubmitError(resolveApiErrorMessage(result.apiError, t.errors, t.addOffer.createError));
      return;
    }

    if (selectedPlan && !isStorePublish) {
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
    setFieldErrors({});
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

  const fieldErrorStyle = (fieldError?: string) => (fieldError ? styles.inputError : undefined);

  if (publishSuccess) {
    return (
      <KeyboardAwareScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
        <SuccessNotice
          title={t.addOffer.successTitle}
          message={t.addOffer.success}
          actionLabel={t.addOffer.viewMyOffers}
          onAction={handleSuccessAction}
        />
      </KeyboardAwareScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView
      ref={scrollViewRef}
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
    >
      <View ref={errorBannerRef} collapsable={false}>
        {submitError ? <ErrorNotice message={submitError} onDismiss={() => setSubmitError('')} /> : null}
      </View>

      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.title}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.subtitle}</AppText>

      {showSkeleton ? (
        <FormFieldsSkeleton rows={6} />
      ) : (
        <>
          <Field error={fieldErrors.title} label={t.addOffer.titleField} isRtl={isRtl}>
            <AppTextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                clearFieldError('title');
              }}
              style={[styles.input, fieldErrorStyle(fieldErrors.title), isRtl ? styles.inputRtl : styles.inputLtr]}
              placeholderTextColor={colors.muted}
            />
          </Field>

          <Field error={fieldErrors.categoryId} label={t.addOffer.category} isRtl={isRtl}>
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
                    onPress={() => {
                      setCategoryId(category.id);
                      clearFieldError('categoryId');
                    }}
                  >
                    <AppText style={[styles.chipText, active && styles.chipTextActive, isRtl ? styles.chipRtl : styles.chipLtr]}>
                      {category.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Field>

          <Field error={fieldErrors.city} label={t.addOffer.city} isRtl={isRtl}>
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
                    style={[styles.chip, active && styles.chipActive, fieldErrors.city ? styles.chipError : undefined]}
                    onPress={() => {
                      setCity(cityOption.value);
                      clearFieldError('city');
                    }}
                  >
                    <AppText style={[styles.chipText, active && styles.chipTextActive, isRtl ? styles.chipRtl : styles.chipLtr]}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Field>

          <Field error={fieldErrors.price} label={t.addOffer.price} isRtl={isRtl}>
            <AppTextInput
              value={price}
              onChangeText={(value) => {
                setPrice(sanitizePriceInput(value));
                clearFieldError('price');
              }}
              keyboardType="decimal-pad"
              style={[styles.input, fieldErrorStyle(fieldErrors.price), isRtl ? styles.inputRtl : styles.inputLtr]}
              placeholderTextColor={colors.muted}
            />
          </Field>

          <Field error={fieldErrors.description} label={t.addOffer.description} isRtl={isRtl}>
            <AppTextInput
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                clearFieldError('description');
              }}
              multiline
              style={[
                styles.input,
                styles.textarea,
                fieldErrorStyle(fieldErrors.description),
                isRtl ? styles.inputRtl : styles.inputLtr
              ]}
              placeholderTextColor={colors.muted}
            />
          </Field>

          {canPublishFromStore ? (
            <View style={styles.promotionSection}>
              <AppText style={[styles.promotionTitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.publishAs}</AppText>
              <AppText style={[styles.promotionSubtitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.publishAsHint}</AppText>
              <View style={styles.publishSourceRow}>
                <Pressable
                  style={[styles.publishSourceCard, publishSource === 'store' && styles.publishSourceCardActive]}
                  onPress={() => {
                    setPublishSource('store');
                    setSelectedPlanId('');
                  }}
                >
                  <AppText style={[styles.publishSourceTitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.publishFromStore}</AppText>
                  <AppText style={[styles.publishSourceHint, isRtl ? styles.rtl : styles.ltr]}>
                    {locale === 'en' ? ownerStore?.nameEn : ownerStore?.nameAr}
                  </AppText>
                </Pressable>
                <Pressable
                  style={[styles.publishSourceCard, publishSource === 'personal' && styles.publishSourceCardActive]}
                  onPress={() => {
                    setPublishSource('personal');
                    setSelectedPlanId((current) => current || plans[0]?.id || '');
                  }}
                >
                  <AppText style={[styles.publishSourceTitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.publishFromPersonal}</AppText>
                  <AppText style={[styles.publishSourceHint, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.publishFromPersonalHint}</AppText>
                </Pressable>
              </View>
            </View>
          ) : null}

          {isStorePublish ? (
            <View style={styles.storePublishNote}>
              <AppText style={[styles.promotionTitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.publishFromStore}</AppText>
              <AppText style={[styles.promotionSubtitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.publishFromStoreHint}</AppText>
            </View>
          ) : descriptionReady ? (
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
                    {displayPlans.map((plan) => {
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
          ) : !canPublishFromStore ? (
            <AppText style={[styles.promotionHint, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.promotionHint}</AppText>
          ) : null}

          <Pressable style={[styles.submit, !canSubmit && styles.submitDisabled]} onPress={submit} disabled={!canSubmit}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText style={styles.submitText}>{t.addOffer.publish}</AppText>
            )}
          </Pressable>
        </>
      )}
    </KeyboardAwareScrollView>
  );
}

function Field({
  error,
  label,
  children,
  isRtl
}: {
  error?: string;
  label: string;
  children: ReactNode;
  isRtl?: boolean;
}) {
  return (
    <View style={styles.field}>
      <AppText style={[styles.label, isRtl ? styles.rtl : styles.ltr]}>{label}</AppText>
      {children}
      {error ? <AppText style={[styles.fieldError, isRtl ? styles.rtl : styles.ltr]}>{error}</AppText> : null}
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
  inputError: {
    borderColor: colors.danger
  },
  fieldError: {
    marginTop: 6,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600'
  },
  chipError: {
    borderColor: colors.danger
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
  publishSourceRow: {
    gap: 10
  },
  publishSourceCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    backgroundColor: '#fff'
  },
  publishSourceCardActive: {
    borderColor: colors.brand,
    backgroundColor: '#ecfdf5'
  },
  publishSourceTitle: {
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4
  },
  publishSourceHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16
  },
  storePublishNote: {
    backgroundColor: '#ecfdf5',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0'
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
