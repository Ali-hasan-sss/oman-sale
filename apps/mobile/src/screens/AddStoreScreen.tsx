import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { ErrorNotice } from '../components/ErrorNotice';
import { PrimaryButton } from '../components/PrimaryButton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { rowDirection } from '../lib/layout-direction';
import { buildCategoryTree } from '../lib/category-tree';
import { resolveApiErrorMessage } from '../lib/api-errors';
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
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [nationalId, setNationalId] = useState('');
  const [commercialRegistrationNumber, setCommercialRegistrationNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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

  const isFormComplete = Boolean(
    nameAr.trim().length >= 2 &&
      nameEn.trim().length >= 2 &&
      phone.trim() &&
      nationalId.trim().length >= 5 &&
      rootCategoryId &&
      storeTypeId &&
      city &&
      wilayah &&
      planId &&
      (businessType !== 'COMMERCIAL' || commercialRegistrationNumber.trim())
  );

  const submit = async (activationMode: 'trial' | 'plan') => {
    if (!accessToken || !isFormComplete) return;
    setError('');
    setIsSubmitting(true);
    setSubmittingMode(activationMode);
    try {
      const result = await createStoreRequest(
        {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          bioAr: bioAr.trim(),
          bioEn: bioEn.trim(),
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
      setError(resolveApiErrorMessage(submitError, t.errors, text.createError));
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
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]} showsVerticalScrollIndicator={false}>
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

        <FieldLabel isRtl={isRtl}>{text.category}</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, rowDirection(isRtl)]}>
          {rootCategories.map((category) => {
            const active = category.id === rootCategoryId;
            const label = locale === 'en' ? category.nameEn || category.name : category.nameAr || category.name;
            return (
              <Pressable key={category.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setRootCategoryId(category.id)}>
                <AppText style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <FieldLabel isRtl={isRtl}>{text.storeType}</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, rowDirection(isRtl)]}>
          {storeTypes.map((storeType) => {
            const active = storeType.id === storeTypeId;
            const label = locale === 'en' ? storeType.nameEn : storeType.nameAr;
            return (
              <Pressable key={storeType.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setStoreTypeId(storeType.id)}>
                <AppText style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <FieldLabel isRtl={isRtl}>{text.city}</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, rowDirection(isRtl)]}>
          {omanGovernorates.map((cityOption) => {
            const active = cityOption.value === city;
            const label = locale === 'en' ? cityOption.en : cityOption.ar;
            return (
              <Pressable
                key={cityOption.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  setCity(cityOption.value);
                  setWilayah('');
                }}
              >
                <AppText style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {city ? (
          <>
            <FieldLabel isRtl={isRtl}>{text.wilayah}</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, rowDirection(isRtl)]}>
              {wilayahOptions.map((wilayahOption) => {
                const active = wilayahOption.value === wilayah;
                const label = locale === 'en' ? wilayahOption.en : wilayahOption.ar;
                return (
                  <Pressable key={wilayahOption.value} style={[styles.chip, active && styles.chipActive]} onPress={() => setWilayah(wilayahOption.value)}>
                    <AppText style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}
      </View>

      <View style={styles.section}>
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
                <Pressable key={plan.id} style={[styles.planCard, active && styles.planCardActive]} onPress={() => setPlanId(plan.id)}>
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
      </View>

      <View style={styles.section}>
        <AppText style={[styles.sectionTitle, textAlign]}>{text.storeDetails}</AppText>

        <FieldLabel isRtl={isRtl}>{text.nameAr}</FieldLabel>
        <AppTextInput value={nameAr} onChangeText={setNameAr} style={[styles.input, inputAlign]} />

        <FieldLabel isRtl={isRtl}>{text.nameEn}</FieldLabel>
        <AppTextInput value={nameEn} onChangeText={setNameEn} style={[styles.input, inputAlign]} />

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
          }}
        >
          <AppText style={[styles.choiceTitle, textAlign]}>{text.homeBusiness}</AppText>
          <AppText style={[styles.choiceHint, textAlign]}>{text.homeBusinessHint}</AppText>
        </Pressable>

        <FieldLabel isRtl={isRtl}>{text.phone}</FieldLabel>
        <AppTextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={[styles.input, inputAlign]} />

        <FieldLabel isRtl={isRtl}>{text.nationalId}</FieldLabel>
        <AppText style={[styles.hint, textAlign]}>{text.nationalIdHint}</AppText>
        <AppTextInput value={nationalId} onChangeText={setNationalId} style={[styles.input, inputAlign]} />

        {businessType === 'COMMERCIAL' ? (
          <>
            <FieldLabel isRtl={isRtl}>{text.crNumber}</FieldLabel>
            <AppTextInput
              value={commercialRegistrationNumber}
              onChangeText={setCommercialRegistrationNumber}
              style={[styles.input, inputAlign]}
            />
          </>
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
            disabled={!isFormComplete || isSubmitting}
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
          disabled={!isFormComplete || isSubmitting}
          style={styles.submit}
        />
      </View>
    </ScrollView>
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
