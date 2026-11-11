import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { ErrorNotice } from '../components/ErrorNotice';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { PrimaryButton } from '../components/PrimaryButton';
import { StoreBrandingPicker } from '../components/vertex/StoreBrandingPicker';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { rowDirection } from '../lib/layout-direction';
import { buildCategoryTree } from '../lib/category-tree';
import { getApiCodeFieldErrors, getValidationFieldErrors, resolveApiErrorMessage } from '../lib/api-errors';
import { openWebPaymentPage } from '../lib/open-external-web';
import { getWilayahsForGovernorate, omanGovernorates } from '../lib/oman-locations';
import { formatPlanVatBreakdown } from '../lib/plan-pricing';
import { canActivateStorePlanWithoutPayment } from '../lib/store-plan-activation';
import { fetchCategories } from '../services/listings.service';
import {
  createStoreRequest,
  fetchMyStores,
  fetchStorePlans,
  fetchStoreTypes,
  getBillingPeriodLabel,
  STORE_BILLING_PERIODS,
  type StoreBillingPeriod,
  type StoreBusinessType,
  type StorePlan
} from '../services/stores.service';
import { useAuthStore } from '../stores';
import { colors, radius } from '../theme';

type AddStoreScreenProps = {
  onCreated?: () => void;
  onAlreadyHasStore?: () => void;
};

function FieldLabel({ children, isRtl }: { children: string; isRtl: boolean }) {
  return <AppText style={[styles.fieldLabel, isRtl ? styles.rtl : styles.ltr]}>{children}</AppText>;
}

const STORE_FIELD_ORDER = [
  'rootCategoryId',
  'storeTypeId',
  'city',
  'wilayah',
  'planId',
  'nameAr',
  'nameEn',
  'phone',
  'nationalId',
  'commercialRegistrationNumber'
] as const;

function summarizeFieldErrors(errors: Record<string, string>, fallback: string) {
  const unique = [...new Set(Object.values(errors).filter(Boolean))];
  return unique.length > 0 ? unique.join('\n') : fallback;
}

function firstInvalidField(errors: Record<string, string>) {
  return STORE_FIELD_ORDER.find((field) => errors[field]) ?? Object.keys(errors)[0];
}

export function AddStoreScreen({ onCreated, onAlreadyHasStore }: AddStoreScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const text = t.store;

  const [categories, setCategories] = useState<Array<{ id: string; name: string; nameAr?: string; nameEn?: string; parentId?: string | null }>>([]);
  const [storeTypes, setStoreTypes] = useState<Array<{ id: string; nameAr: string; nameEn: string }>>([]);
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [rootCategoryId, setRootCategoryId] = useState('');
  const [storeTypeId, setStoreTypeId] = useState('');
  const [city, setCity] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [planId, setPlanId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<StoreBillingPeriod>('ONE_MONTH');
  const [businessType, setBusinessType] = useState<StoreBusinessType>('HOME');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [bioAr, setBioAr] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [nationalId, setNationalId] = useState('');
  const [commercialRegistrationNumber, setCommercialRegistrationNumber] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollViewType>(null);
  const contentRef = useRef<View>(null);
  const fieldNodes = useRef<Partial<Record<string, View | null>>>({});
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingMode, setSubmittingMode] = useState<'trial' | 'plan' | null>(null);
  const [blocked, setBlocked] = useState(false);

  const rootCategories = useMemo(() => buildCategoryTree(categories), [categories]);
  const selectedPlan = plans.find((plan) => plan.id === planId);
  const selectedPricing = selectedPlan?.pricing.find((row) => row.billingPeriod === billingPeriod);
  const finalPrice = Number(selectedPricing?.finalPrice ?? selectedPricing?.price ?? 0);
  const wilayahOptions = useMemo(() => (city ? getWilayahsForGovernorate(city) : []), [city]);
  const isTrialEligible = Boolean(selectedPlan?.trialAvailable);
  const canActivateFree = selectedPlan
    ? canActivateStorePlanWithoutPayment(selectedPlan, billingPeriod, finalPrice)
    : false;
  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const inputAlign = isRtl ? styles.inputRtl : styles.inputLtr;

  useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone);
  }, [phone, user?.phone]);

  useEffect(() => {
    fetchCategories(locale)
      .then((items) => setCategories(Array.isArray(items) ? items : []))
      .catch(() => setError(text.loadError));

    fetchStoreTypes()
      .then((items) => setStoreTypes(Array.isArray(items) ? items : []))
      .catch(() => setError(text.loadError))
      .finally(() => setIsLoading(false));
  }, [locale, text.loadError]);

  useEffect(() => {
    if (!accessToken) return;
    fetchMyStores()
      .then((stores) => {
        if (stores.length >= 1) {
          setBlocked(true);
          onAlreadyHasStore?.();
        }
      })
      .catch(() => undefined);
  }, [accessToken, onAlreadyHasStore]);

  useEffect(() => {
    if (!rootCategoryId) {
      setPlans([]);
      setPlanId('');
      return;
    }
    setIsLoadingPlans(true);
    fetchStorePlans(rootCategoryId)
      .then((items) => {
        setPlans(items);
        setPlanId(items[0]?.id ?? '');
      })
      .catch(() => setError(text.loadError))
      .finally(() => setIsLoadingPlans(false));
  }, [rootCategoryId, text.loadError]);

  const scrollToField = useCallback((field?: string) => {
    Keyboard.dismiss();

    const runScroll = () => {
      const node = (field && fieldNodes.current[field]) || null;
      const content = contentRef.current;
      if (!node || !content) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }

      content.measureInWindow((_contentX, contentY) => {
        node.measureInWindow((_fieldX, fieldY) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(fieldY - contentY - 12, 0),
            animated: true
          });
        });
      });
    };

    requestAnimationFrame(runScroll);
    setTimeout(runScroll, 80);
    setTimeout(runScroll, 320);
  }, []);

  const showFieldErrors = useCallback(
    (errors: Record<string, string>) => {
      setFieldErrors(errors);
      setError(summarizeFieldErrors(errors, t.errors.VALIDATION_FAILED));
      scrollToField(firstInvalidField(errors));
    },
    [scrollToField, t.errors.VALIDATION_FAILED]
  );

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const collectFieldErrors = () => {
    const errors: Record<string, string> = {};
    if (!rootCategoryId) errors.rootCategoryId = t.errors.fieldCategoryRequired;
    if (!storeTypeId) errors.storeTypeId = t.errors.fieldStoreType;
    if (!city) errors.city = t.errors.fieldCityRequired;
    else if (!wilayah) errors.wilayah = t.errors.fieldWilayahRequired;
    if (!planId) errors.planId = t.errors.fieldStorePlan;
    if (nameAr.trim().length < 2) errors.nameAr = t.errors.fieldStoreNameAr;
    if (nameEn.trim().length < 2) errors.nameEn = t.errors.fieldStoreNameEn;
    if (phone.trim().length < 6) errors.phone = t.errors.fieldStorePhone;
    if (nationalId.trim().length < 5) errors.nationalId = t.errors.fieldStoreNationalId;
    if (businessType === 'COMMERCIAL' && commercialRegistrationNumber.trim().length < 3) {
      errors.commercialRegistrationNumber = t.errors.fieldStoreCr;
    }
    return errors;
  };

  const submit = async (activationMode: 'trial' | 'plan') => {
    if (!accessToken) return;
    const nextFieldErrors = collectFieldErrors();
    if (Object.keys(nextFieldErrors).length > 0) {
      showFieldErrors(nextFieldErrors);
      return;
    }
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);
    setSubmittingMode(activationMode);
    try {
      const result = await createStoreRequest(
        {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          bioAr: bioAr.trim(),
          bioEn: bioEn.trim(),
          ...(logoUrl ? { logoUrl } : {}),
          ...(coverUrl ? { coverUrl } : {}),
          phone: phone.trim(),
          nationalId: nationalId.trim(),
          businessType,
          ...(businessType === 'COMMERCIAL'
            ? { commercialRegistrationNumber: commercialRegistrationNumber.trim() }
            : {}),
          rootCategoryId,
          storeTypeId,
          city,
          wilayah,
          planId,
          billingPeriod,
          activationMode
        },
        locale
      );

      if (result.requiresPayment && result.checkout?.paymentUrl) {
        await openWebPaymentPage(result.checkout.paymentUrl);
        onCreated?.();
        return;
      }

      onCreated?.();
    } catch (submitError) {
      const apiFieldErrors = {
        ...getApiCodeFieldErrors(submitError, t.errors),
        ...getValidationFieldErrors(submitError, t.errors)
      };
      if (Object.keys(apiFieldErrors).length > 0) {
        showFieldErrors(apiFieldErrors);
      } else {
        setFieldErrors({});
        setError(resolveApiErrorMessage(submitError, t.errors, text.createError));
        scrollToField();
      }
    } finally {
      setIsSubmitting(false);
      setSubmittingMode(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (blocked) {
    return (
      <View style={[styles.center, styles.blockedWrap]}>
        <AppText style={[styles.blockedText, textAlign]}>{text.alreadyHasStore}</AppText>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      ref={scrollViewRef}
      contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <View ref={contentRef} collapsable={false} style={styles.content}>
      <View style={[styles.headerRow, rowDirection(isRtl)]}>
        <View style={styles.headerIcon}>
          <Ionicons name="storefront" size={22} color={colors.brandDark} />
        </View>
        <View style={styles.headerCopy}>
          <AppText style={[styles.title, textAlign]}>{text.title}</AppText>
          <AppText style={[styles.subtitle, textAlign]}>{text.subtitle}</AppText>
        </View>
      </View>

      {error ? <ErrorNotice message={error} onDismiss={() => setError('')} /> : null}

      <View style={styles.section}>
        <AppText style={[styles.sectionTitle, textAlign]}>{text.classificationAndLocation}</AppText>

        <View
          collapsable={false}
          ref={(node) => {
            fieldNodes.current.rootCategoryId = node;
          }}
        >
          <FieldLabel isRtl={isRtl}>{text.category}</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, rowDirection(isRtl)]}>
            {rootCategories.map((category) => {
              const active = category.id === rootCategoryId;
              const label = locale === 'en' ? category.nameEn || category.name : category.nameAr || category.name;
              return (
                <Pressable
                  key={category.id}
                  style={[styles.chip, active && styles.chipActive, fieldErrors.rootCategoryId ? styles.chipError : undefined]}
                  onPress={() => {
                    setRootCategoryId(category.id);
                    clearFieldError('rootCategoryId');
                    clearFieldError('planId');
                  }}
                >
                  <AppText style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>
          {fieldErrors.rootCategoryId ? <AppText style={[styles.fieldError, textAlign]}>{fieldErrors.rootCategoryId}</AppText> : null}
        </View>

        <View
          collapsable={false}
          ref={(node) => {
            fieldNodes.current.storeTypeId = node;
          }}
        >
          <FieldLabel isRtl={isRtl}>{text.storeType}</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, rowDirection(isRtl)]}>
            {storeTypes.map((storeType) => {
              const active = storeType.id === storeTypeId;
              const label = locale === 'en' ? storeType.nameEn : storeType.nameAr;
              return (
                <Pressable
                  key={storeType.id}
                  style={[styles.chip, active && styles.chipActive, fieldErrors.storeTypeId ? styles.chipError : undefined]}
                  onPress={() => {
                    setStoreTypeId(storeType.id);
                    clearFieldError('storeTypeId');
                  }}
                >
                  <AppText style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>
          {fieldErrors.storeTypeId ? <AppText style={[styles.fieldError, textAlign]}>{fieldErrors.storeTypeId}</AppText> : null}
        </View>

        <View
          collapsable={false}
          ref={(node) => {
            fieldNodes.current.city = node;
          }}
        >
        <FieldLabel isRtl={isRtl}>{text.city}</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, rowDirection(isRtl)]}>
          {omanGovernorates.map((cityOption) => {
            const active = cityOption.value === city;
            const label = locale === 'en' ? cityOption.en : cityOption.ar;
            return (
              <Pressable
                key={cityOption.value}
                style={[styles.chip, active && styles.chipActive, fieldErrors.city ? styles.chipError : undefined]}
                onPress={() => {
                  setCity(cityOption.value);
                  setWilayah('');
                  clearFieldError('city');
                  clearFieldError('wilayah');
                }}
              >
                <AppText style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>
        {fieldErrors.city ? <AppText style={[styles.fieldError, textAlign]}>{fieldErrors.city}</AppText> : null}
        </View>

        {city ? (
          <View
            collapsable={false}
            ref={(node) => {
              fieldNodes.current.wilayah = node;
            }}
          >
            <FieldLabel isRtl={isRtl}>{text.wilayah}</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, rowDirection(isRtl)]}>
              {wilayahOptions.map((wilayahOption) => {
                const active = wilayahOption.value === wilayah;
                const label = locale === 'en' ? wilayahOption.en : wilayahOption.ar;
                return (
                  <Pressable
                  key={wilayahOption.value}
                  style={[styles.chip, active && styles.chipActive, fieldErrors.wilayah ? styles.chipError : undefined]}
                  onPress={() => {
                    setWilayah(wilayahOption.value);
                    clearFieldError('wilayah');
                  }}
                >
                    <AppText style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
            {fieldErrors.wilayah ? <AppText style={[styles.fieldError, textAlign]}>{fieldErrors.wilayah}</AppText> : null}
          </View>
        ) : null}
      </View>

      <View
        style={styles.section}
        collapsable={false}
        ref={(node) => {
          fieldNodes.current.planId = node;
        }}
      >
        <AppText style={[styles.sectionTitle, textAlign]}>{text.plan}</AppText>
        {!rootCategoryId ? (
          <AppText style={[styles.empty, textAlign]}>{text.selectCategoryFirst}</AppText>
        ) : isLoadingPlans ? (
          <ActivityIndicator color={colors.brand} />
        ) : plans.length === 0 ? (
          <AppText style={[styles.empty, textAlign]}>{text.noPlans}</AppText>
        ) : (
          <>
            {plans.map((plan) => {
              const active = planId === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  style={[styles.planCard, active && styles.planCardActive, fieldErrors.planId ? styles.chipError : undefined]}
                  onPress={() => {
                    setPlanId(plan.id);
                    clearFieldError('planId');
                  }}
                >
                  <View style={[styles.planHeader, rowDirection(isRtl)]}>
                    <AppText style={styles.planTitle}>{locale === 'en' ? plan.nameEn : plan.nameAr}</AppText>
                    {plan.trialAvailable ? (
                      <View style={styles.trialBadge}>
                        <AppText style={styles.trialBadgeText}>{text.trialBadge}</AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText style={styles.planDesc}>{locale === 'en' ? plan.descriptionEn : plan.descriptionAr}</AppText>
                  <AppText style={styles.planMeta}>
                    {text.maxListings}: {plan.pricing[0]?.maxListings ?? '-'}
                    {plan.trialDays ? ` · ${plan.trialDays} ${text.trialDays}` : ''}
                  </AppText>
                </Pressable>
              );
            })}

            {selectedPlan ? (
              <>
                <FieldLabel isRtl={isRtl}>{text.selectPeriod}</FieldLabel>
                <AppText style={[styles.hint, textAlign]}>{text.selectPeriodHint}</AppText>
                <View style={[styles.periodRow, rowDirection(isRtl)]}>
                  {STORE_BILLING_PERIODS.map((period) => {
                    const row = selectedPlan.pricing.find((item) => item.billingPeriod === period);
                    if (!row) return null;
                    const basePrice = Number(row.finalPrice ?? row.price);
                    const pricing = formatPlanVatBreakdown(basePrice, locale, {
                      free: t.common.pricing.free,
                      vatShort: t.common.pricing.vatShort
                    });
                    const active = billingPeriod === period;
                    return (
                      <Pressable key={period} style={[styles.periodChip, active && styles.periodChipActive]} onPress={() => setBillingPeriod(period)}>
                        <AppText style={[styles.periodText, active && styles.periodTextActive]}>
                          {getBillingPeriodLabel(period, locale)} · {pricing.main}
                        </AppText>
                        <AppText style={[styles.periodMeta, active && styles.periodTextActive]}>
                          {text.maxListings}: {row.maxListings}
                        </AppText>
                        {pricing.sub ? (
                          <AppText style={[styles.periodVat, active && styles.periodTextActive]}>{pricing.sub}</AppText>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </>
        )}
        {fieldErrors.planId ? <AppText style={[styles.fieldError, textAlign]}>{fieldErrors.planId}</AppText> : null}
      </View>

      <View style={styles.section}>
        <AppText style={[styles.sectionTitle, textAlign]}>{text.storeDetails}</AppText>

        <StoreBrandingPicker logoUrl={logoUrl} coverUrl={coverUrl} onLogoChange={setLogoUrl} onCoverChange={setCoverUrl} />

        <View
          collapsable={false}
          ref={(node) => {
            fieldNodes.current.nameAr = node;
          }}
        >
          <FieldLabel isRtl={isRtl}>{text.nameAr}</FieldLabel>
          <AppTextInput
            value={nameAr}
            onChangeText={(value) => {
              setNameAr(value);
              clearFieldError('nameAr');
            }}
            style={[styles.input, inputAlign, fieldErrors.nameAr ? styles.inputError : undefined]}
          />
          {fieldErrors.nameAr ? <AppText style={[styles.fieldError, textAlign]}>{fieldErrors.nameAr}</AppText> : null}
        </View>

        <View
          collapsable={false}
          ref={(node) => {
            fieldNodes.current.nameEn = node;
          }}
        >
          <FieldLabel isRtl={isRtl}>{text.nameEn}</FieldLabel>
          <AppTextInput
            value={nameEn}
            onChangeText={(value) => {
              setNameEn(value);
              clearFieldError('nameEn');
            }}
            style={[styles.input, inputAlign, fieldErrors.nameEn ? styles.inputError : undefined]}
          />
          {fieldErrors.nameEn ? <AppText style={[styles.fieldError, textAlign]}>{fieldErrors.nameEn}</AppText> : null}
        </View>

        <FieldLabel isRtl={isRtl}>{text.bioAr}</FieldLabel>
        <AppTextInput value={bioAr} onChangeText={setBioAr} multiline style={[styles.input, styles.multiline, inputAlign]} />

        <FieldLabel isRtl={isRtl}>{text.bioEn}</FieldLabel>
        <AppTextInput value={bioEn} onChangeText={setBioEn} multiline style={[styles.input, styles.multiline, inputAlign]} />

        <FieldLabel isRtl={isRtl}>{text.storeClassification}</FieldLabel>
        <Pressable
          style={[styles.choiceCard, businessType === 'COMMERCIAL' && styles.choiceCardActive]}
          onPress={() => setBusinessType('COMMERCIAL')}
        >
          <AppText style={[styles.choiceTitle, textAlign]}>{text.commercialStore}</AppText>
          <AppText style={[styles.choiceHint, textAlign]}>{text.commercialStoreHint}</AppText>
        </Pressable>
        <Pressable
          style={[styles.choiceCard, businessType === 'HOME' && styles.choiceCardActive]}
          onPress={() => {
            setBusinessType('HOME');
            setCommercialRegistrationNumber('');
            clearFieldError('commercialRegistrationNumber');
          }}
        >
          <AppText style={[styles.choiceTitle, textAlign]}>{text.homeBusiness}</AppText>
          <AppText style={[styles.choiceHint, textAlign]}>{text.homeBusinessHint}</AppText>
        </Pressable>

        <View
          collapsable={false}
          ref={(node) => {
            fieldNodes.current.phone = node;
          }}
        >
          <FieldLabel isRtl={isRtl}>{text.phone}</FieldLabel>
          <AppTextInput
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              clearFieldError('phone');
            }}
            keyboardType="phone-pad"
            style={[styles.input, inputAlign, fieldErrors.phone ? styles.inputError : undefined]}
          />
          {fieldErrors.phone ? <AppText style={[styles.fieldError, textAlign]}>{fieldErrors.phone}</AppText> : null}
        </View>

        <View
          collapsable={false}
          ref={(node) => {
            fieldNodes.current.nationalId = node;
          }}
        >
          <FieldLabel isRtl={isRtl}>{text.nationalId}</FieldLabel>
          <AppText style={[styles.hint, textAlign]}>{text.nationalIdHint}</AppText>
          <AppTextInput
            value={nationalId}
            onChangeText={(value) => {
              setNationalId(value);
              clearFieldError('nationalId');
            }}
            style={[styles.input, inputAlign, fieldErrors.nationalId ? styles.inputError : undefined]}
          />
          {fieldErrors.nationalId ? <AppText style={[styles.fieldError, textAlign]}>{fieldErrors.nationalId}</AppText> : null}
        </View>

        {businessType === 'COMMERCIAL' ? (
          <View
            collapsable={false}
            ref={(node) => {
              fieldNodes.current.commercialRegistrationNumber = node;
            }}
          >
            <FieldLabel isRtl={isRtl}>{text.crNumber}</FieldLabel>
            <AppTextInput
              value={commercialRegistrationNumber}
              onChangeText={(value) => {
                setCommercialRegistrationNumber(value);
                clearFieldError('commercialRegistrationNumber');
              }}
              style={[styles.input, inputAlign, fieldErrors.commercialRegistrationNumber ? styles.inputError : undefined]}
            />
            {fieldErrors.commercialRegistrationNumber ? (
              <AppText style={[styles.fieldError, textAlign]}>{fieldErrors.commercialRegistrationNumber}</AppText>
            ) : null}
          </View>
        ) : null}

        {selectedPlan ? (
          <View style={styles.summary}>
            <AppText style={[styles.summaryLabel, textAlign]}>{text.selectedPlanSummary}</AppText>
            <AppText style={[styles.summaryName, textAlign]}>{locale === 'en' ? selectedPlan.nameEn : selectedPlan.nameAr}</AppText>
            <AppText style={[styles.hint, textAlign]}>{getBillingPeriodLabel(billingPeriod, locale)}</AppText>
            <AppText style={[styles.summaryPrice, textAlign]}>
              {
                formatPlanVatBreakdown(finalPrice, locale, {
                  free: t.common.pricing.free,
                  vatShort: t.common.pricing.vatShort
                }).main
              }
            </AppText>
          </View>
        ) : null}

        {isTrialEligible ? (
          <PrimaryButton
            label={submittingMode === 'trial' ? text.submitting : text.submitTrial}
            onPress={() => void submit('trial')}
            loading={isSubmitting && submittingMode === 'trial'}
            disabled={isSubmitting}
            variant="soft"
            style={styles.submit}
          />
        ) : null}
        <PrimaryButton
          label={
            submittingMode === 'plan' ? text.submitting : canActivateFree ? text.activatePlan : text.submitPaid
          }
          onPress={() => void submit('plan')}
          loading={isSubmitting && submittingMode === 'plan'}
          disabled={isSubmitting}
          style={styles.submit}
        />
      </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blockedWrap: { padding: 24 },
  blockedText: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  content: { padding: 16, gap: 12 },
  headerRow: { alignItems: 'center', gap: 12, marginBottom: 4 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerCopy: { flex: 1 },
  title: { fontSize: 24, fontWeight: '900', color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: colors.ink, marginBottom: 8 },
  fieldLabel: { fontWeight: '800', marginTop: 8, marginBottom: 6, color: colors.ink },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    marginBottom: 4
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  chips: { gap: 8, paddingVertical: 4, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontWeight: '700', color: colors.ink },
  chipTextActive: { color: '#fff' },
  chipError: { borderColor: colors.danger },
  inputError: { borderColor: colors.danger },
  fieldError: { marginTop: 4, marginBottom: 6, color: colors.danger, fontSize: 13, fontWeight: '600' },
  planCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 12, marginBottom: 8 },
  planCardActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  planHeader: { alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  planTitle: { fontWeight: '900', color: colors.ink, flex: 1 },
  planDesc: { color: colors.muted, lineHeight: 20 },
  planMeta: { marginTop: 6, color: colors.brandDark, fontWeight: '700', fontSize: 12 },
  trialBadge: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  trialBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  periodRow: { flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  periodChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 8, minWidth: '30%', flexGrow: 1 },
  periodChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  periodText: { fontWeight: '700', color: colors.ink },
  periodTextActive: { color: '#fff' },
  periodMeta: { marginTop: 4, fontSize: 11, color: colors.muted },
  periodVat: { marginTop: 4, fontSize: 11, color: colors.muted },
  empty: { color: colors.muted, marginBottom: 12 },
  choiceCard: { borderWidth: 2, borderColor: colors.line, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  choiceCardActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  choiceTitle: { fontWeight: '800', color: colors.ink },
  choiceHint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  summary: { borderRadius: radius.md, backgroundColor: colors.brandSoft, padding: 12, marginTop: 8, marginBottom: 8 },
  summaryLabel: { color: colors.brandDark, fontWeight: '800', fontSize: 12 },
  summaryName: { fontWeight: '900', color: colors.ink, fontSize: 16, marginTop: 4 },
  summaryPrice: { fontWeight: '900', color: colors.brandDark, fontSize: 20, marginTop: 8 },
  submit: { marginTop: 8 },
  rtl: { textAlign: 'right' },
  ltr: { textAlign: 'left' },
  inputRtl: { textAlign: 'right' },
  inputLtr: { textAlign: 'left' }
});
