import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { ErrorNotice } from '../components/ErrorNotice';
import { PrimaryButton } from '../components/PrimaryButton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { buildCategoryTree } from '../lib/category-tree';
import { resolveApiErrorMessage } from '../lib/api-errors';
import { getCityLabel, omanCities } from '../lib/oman-cities';
import { formatPlanVatBreakdown } from '../lib/plan-pricing';
import { fetchCategories } from '../services/listings.service';
import {
  createStoreRequest,
  fetchMyStores,
  fetchStorePlans,
  fetchStoreTypes,
  getBillingPeriodLabel,
  STORE_BILLING_PERIODS,
  type StoreBillingPeriod,
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

  const [categories, setCategories] = useState<Array<{ id: string; name: string; nameAr?: string; nameEn?: string; parentId?: string | null }>>([]);
  const [storeTypes, setStoreTypes] = useState<Array<{ id: string; nameAr: string; nameEn: string }>>([]);
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [rootCategoryId, setRootCategoryId] = useState('');
  const [storeTypeId, setStoreTypeId] = useState('');
  const [city, setCity] = useState('');
  const [planId, setPlanId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<StoreBillingPeriod>('ONE_MONTH');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [bioAr, setBioAr] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [commercialRegistrationNumber, setCommercialRegistrationNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const rootCategories = useMemo(() => buildCategoryTree(categories), [categories]);
  const selectedPlan = plans.find((plan) => plan.id === planId);
  const selectedPricing = selectedPlan?.pricing.find((row) => row.billingPeriod === billingPeriod);
  const finalPrice = Number(selectedPricing?.finalPrice ?? selectedPricing?.price ?? 0);
  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const inputAlign = isRtl ? styles.inputRtl : styles.inputLtr;

  useEffect(() => {
    fetchCategories(locale)
      .then((items) => setCategories(Array.isArray(items) ? items : []))
      .catch(() => setError(t.store.loadError));

    fetchStoreTypes()
      .then((items) => setStoreTypes(Array.isArray(items) ? items : []))
      .catch(() => setError(t.store.loadError))
      .finally(() => setIsLoading(false));
  }, [locale, t.store.loadError]);

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
    fetchStorePlans(rootCategoryId)
      .then((items) => {
        setPlans(items);
        setPlanId(items[0]?.id ?? '');
      })
      .catch(() => setError(t.store.loadError));
  }, [rootCategoryId, t.store.loadError]);

  const submit = async () => {
    if (!accessToken || !planId || !rootCategoryId || !storeTypeId || !city) return;
    setError('');
    setIsSubmitting(true);
    try {
      const result = await createStoreRequest(
        {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          bioAr: bioAr.trim(),
          bioEn: bioEn.trim(),
          phone: phone.trim(),
          nationalId: nationalId.trim(),
          commercialRegistrationNumber: commercialRegistrationNumber.trim(),
          rootCategoryId,
          storeTypeId,
          city,
          planId,
          billingPeriod
        },
        locale
      );

      if (result.requiresPayment && result.checkout?.paymentUrl) {
        await Linking.openURL(result.checkout.paymentUrl);
        return;
      }

      onCreated?.();
    } catch (submitError) {
      setError(resolveApiErrorMessage(submitError, t.errors, t.store.createError));
    } finally {
      setIsSubmitting(false);
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
        <AppText style={[styles.blockedText, textAlign]}>{t.store.alreadyHasStore}</AppText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]} showsVerticalScrollIndicator={false}>
      <AppText style={[styles.title, textAlign]}>{t.store.title}</AppText>
      <AppText style={[styles.subtitle, textAlign]}>{t.store.subtitle}</AppText>

      {error ? <ErrorNotice message={error} onDismiss={() => setError('')} /> : null}

      <FieldLabel isRtl={isRtl}>{t.store.nameAr}</FieldLabel>
      <AppTextInput value={nameAr} onChangeText={setNameAr} style={[styles.input, inputAlign]} />

      <FieldLabel isRtl={isRtl}>{t.store.nameEn}</FieldLabel>
      <AppTextInput value={nameEn} onChangeText={setNameEn} style={[styles.input, inputAlign]} />

      <FieldLabel isRtl={isRtl}>{t.store.bioAr}</FieldLabel>
      <AppTextInput value={bioAr} onChangeText={setBioAr} multiline style={[styles.input, styles.multiline, inputAlign]} />

      <FieldLabel isRtl={isRtl}>{t.store.bioEn}</FieldLabel>
      <AppTextInput value={bioEn} onChangeText={setBioEn} multiline style={[styles.input, styles.multiline, inputAlign]} />

      <FieldLabel isRtl={isRtl}>{t.store.phone}</FieldLabel>
      <AppTextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={[styles.input, inputAlign]} />

      <FieldLabel isRtl={isRtl}>{t.store.nationalId}</FieldLabel>
      <AppText style={[styles.hint, textAlign]}>{t.store.nationalIdHint}</AppText>
      <AppTextInput value={nationalId} onChangeText={setNationalId} style={[styles.input, inputAlign]} />

      <FieldLabel isRtl={isRtl}>{t.store.crNumber}</FieldLabel>
      <AppTextInput value={commercialRegistrationNumber} onChangeText={setCommercialRegistrationNumber} style={[styles.input, inputAlign]} />

      <FieldLabel isRtl={isRtl}>{t.store.category}</FieldLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
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

      <FieldLabel isRtl={isRtl}>{t.store.storeType}</FieldLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
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

      <FieldLabel isRtl={isRtl}>{t.store.city}</FieldLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {omanCities.map((cityOption) => {
          const active = cityOption.value === city;
          const label = locale === 'en' ? cityOption.en : cityOption.ar;
          return (
            <Pressable key={cityOption.value} style={[styles.chip, active && styles.chipActive]} onPress={() => setCity(cityOption.value)}>
              <AppText style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {plans.length > 0 ? (
        <>
          <FieldLabel isRtl={isRtl}>{t.store.plan}</FieldLabel>
          {plans.map((plan) => (
            <Pressable key={plan.id} style={[styles.planCard, planId === plan.id && styles.planCardActive]} onPress={() => setPlanId(plan.id)}>
              <AppText style={styles.planTitle}>{locale === 'en' ? plan.nameEn : plan.nameAr}</AppText>
              <AppText style={styles.planDesc}>{locale === 'en' ? plan.descriptionEn : plan.descriptionAr}</AppText>
            </Pressable>
          ))}

          <View style={styles.periodRow}>
            {STORE_BILLING_PERIODS.map((period) => {
              const row = selectedPlan?.pricing.find((item) => item.billingPeriod === period);
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
                  {pricing.sub ? (
                    <AppText style={[styles.periodVat, active && styles.periodTextActive]}>{pricing.sub}</AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </>
      ) : rootCategoryId ? (
        <AppText style={[styles.empty, textAlign]}>{t.store.noPlans}</AppText>
      ) : null}

      <PrimaryButton
        label={finalPrice <= 0 ? t.store.submitFree : t.store.submitPaid}
        onPress={submit}
        loading={isSubmitting}
        disabled={!planId || !rootCategoryId || !storeTypeId || !city || plans.length === 0}
        style={styles.submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blockedWrap: { padding: 24 },
  blockedText: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '900', color: colors.ink },
  subtitle: { color: colors.muted, marginBottom: 12 },
  fieldLabel: { fontWeight: '800', marginTop: 8, marginBottom: 6, color: colors.ink },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
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
  planTitle: { fontWeight: '900', marginBottom: 4, color: colors.ink },
  planDesc: { color: colors.muted, lineHeight: 20 },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  periodChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 8 },
  periodChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  periodText: { fontWeight: '700', color: colors.ink },
  periodTextActive: { color: '#fff' },
  periodVat: { marginTop: 2, fontSize: 11, color: colors.muted },
  periodVat: { marginTop: 4, fontSize: 11, color: colors.muted, textAlign: 'center' },
  empty: { color: colors.muted, marginBottom: 12 },
  submit: { marginTop: 8 },
  rtl: { textAlign: 'right' },
  ltr: { textAlign: 'left' },
  inputRtl: { textAlign: 'right' },
  inputLtr: { textAlign: 'left' }
});
