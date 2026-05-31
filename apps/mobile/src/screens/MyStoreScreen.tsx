import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View
} from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorNotice } from '../components/ErrorNotice';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import {
  activateStorePaidRequest,
  deleteStoreRequest,
  fetchMyStores,
  fetchStoreAds,
  fetchStorePlans,
  renewStoreSubscriptionRequest,
  updateStoreRequest,
  type OwnerStore,
  type StorePlan
} from '../services/stores.service';
import type { Listing } from '../types';
import { colors, radius, shadow } from '../theme';

type MyStoreScreenProps = {
  onCreateStore: () => void;
  onOpenListing: (id: string) => void;
};

export function MyStoreScreen({ onCreateStore, onOpenListing }: MyStoreScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const text = t.myStore;

  const [store, setStore] = useState<OwnerStore | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [bioAr, setBioAr] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState('');
  const [upgradeBillingPeriod, setUpgradeBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeSubscription = useMemo(() => {
    if (!store) return null;
    const now = Date.now();
    return (
      store.subscriptions.find(
        (subscription) =>
          subscription.isActive &&
          subscription.status === 'ACTIVE' &&
          subscription.endsAt &&
          new Date(subscription.endsAt).getTime() > now
      ) ?? null
    );
  }, [store]);

  const effectiveMaxListings = useMemo(() => {
    if (!activeSubscription) return 0;
    if (activeSubscription.isTrial && (activeSubscription.plan?.trialMaxListings ?? 0) > 0) {
      return activeSubscription.plan!.trialMaxListings!;
    }
    return activeSubscription.maxListings;
  }, [activeSubscription]);

  const isOnActiveTrial = Boolean(store?.accessStatus === 'TRIAL' && activeSubscription?.isTrial);
  const showPayButton = isOnActiveTrial;
  const showRenewButton = Boolean(store?.requiresPayment && !isOnActiveTrial);
  const showUpgradeButton = Boolean(store && (store.accessStatus === 'ACTIVE' || store.accessStatus === 'TRIAL'));

  const loadPlans = useCallback(async (rootCategoryId: string) => {
    setIsLoadingPlans(true);
    try {
      const nextPlans = await fetchStorePlans(rootCategoryId);
      setPlans(nextPlans);
      setSelectedUpgradePlanId((current) => {
        if (current && nextPlans.some((plan) => plan.id === current)) return current;
        return nextPlans[0]?.id ?? '';
      });
    } catch {
      setPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  const loadStore = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const stores = await fetchMyStores();
      const nextStore = stores.find((item) => item.isActive) ?? stores[0] ?? null;
      setStore(nextStore);
      if (nextStore) {
        setLogoUrl(nextStore.logoUrl ?? null);
        setCoverUrl(nextStore.coverUrl ?? null);
        setBioAr(nextStore.bioAr ?? '');
        setBioEn(nextStore.bioEn ?? '');
        const items = await fetchStoreAds(nextStore.id);
        setListings(items);
      }
    } catch {
      setError(text.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [text.loadError]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  useEffect(() => {
    if (!showUpgradePanel || !store?.rootCategory?.id) return;
    loadPlans(store.rootCategory.id);
  }, [showUpgradePanel, store?.rootCategory?.id, loadPlans]);

  useEffect(() => {
    if (activeSubscription?.billingPeriod) {
      setUpgradeBillingPeriod(activeSubscription.billingPeriod);
    }
  }, [activeSubscription?.billingPeriod]);

  const pickImage = async (target: 'logo' | 'cover') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const mime = result.assets[0].mimeType ?? 'image/jpeg';
    const dataUrl = `data:${mime};base64,${result.assets[0].base64}`;
    if (target === 'logo') setLogoUrl(dataUrl);
    else setCoverUrl(dataUrl);
  };

  const saveStore = async () => {
    if (!store) return;
    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      const updated = await updateStoreRequest(store.id, {
        logoUrl: logoUrl ?? undefined,
        coverUrl: coverUrl ?? undefined,
        bioAr,
        bioEn
      });
      setStore((current) => (current ? { ...current, ...updated } : current));
      setMessage(text.saved);
    } catch {
      setError(text.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const startCheckout = async (
    action: 'activate-paid' | 'subscribe',
    options?: { planId: string; billingPeriod: 'MONTHLY' | 'YEARLY' }
  ) => {
    if (!store) return;
    const subscription = activeSubscription ?? store.subscriptions[0];
    if (!subscription && action !== 'subscribe') return;
    if (action === 'subscribe' && !options?.planId && !subscription) return;

    setIsPaying(true);
    setError('');
    try {
      const result =
        action === 'activate-paid'
          ? await activateStorePaidRequest(store.id, locale)
          : await renewStoreSubscriptionRequest(
              store.id,
              {
                planId: options?.planId ?? subscription!.planId,
                billingPeriod: options?.billingPeriod ?? subscription!.billingPeriod
              },
              locale
            );
      if (result.checkout?.paymentUrl) {
        await Linking.openURL(result.checkout.paymentUrl);
        return;
      }
      setShowUpgradePanel(false);
      await loadStore();
    } catch {
      setError(text.checkoutError);
    } finally {
      setIsPaying(false);
    }
  };

  const getPlanPrice = (plan: StorePlan, period: 'MONTHLY' | 'YEARLY') => {
    const row = plan.pricing.find((pricing) => pricing.billingPeriod === period);
    const value = Number(row?.finalPrice ?? row?.price ?? 0);
    return value <= 0 ? text.free : `${value.toFixed(3)} OMR`;
  };

  const deleteStore = async () => {
    if (!store) return;
    setIsDeleting(true);
    setError('');
    try {
      await deleteStoreRequest(store.id);
      setShowDeleteConfirm(false);
      setMessage(text.deleted);
      await loadStore();
    } catch {
      setError(text.deleteError);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const storeName = store ? (locale === 'en' ? store.nameEn : store.nameAr) : '';
  const textAlign = isRtl ? styles.textRtl : styles.textLtr;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={[styles.centered, styles.emptyWrap]}>
        <AppText style={[styles.emptyText, textAlign]}>{text.noStore}</AppText>
        <Pressable style={styles.primaryButton} onPress={onCreateStore}>
          <AppText style={styles.primaryButtonText}>{text.createStore}</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
      <AppText style={[styles.title, textAlign]}>{text.title}</AppText>
      <AppText style={[styles.subtitle, textAlign]}>{text.subtitle}</AppText>

      {error ? <ErrorNotice message={error} onDismiss={() => setError('')} /> : null}
      {message ? (
        <View style={styles.successBanner}>
          <AppText style={styles.successText}>{message}</AppText>
        </View>
      ) : null}

      <View style={styles.coverWrap}>
        {coverUrl ? <Image source={{ uri: coverUrl }} style={styles.cover} /> : null}
        {!coverUrl ? (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image-outline" size={28} color={colors.muted} />
          </View>
        ) : null}
        <Pressable style={styles.coverBtn} onPress={() => pickImage('cover')}>
          <AppText style={styles.coverBtnText}>{text.changeCover}</AppText>
        </Pressable>
      </View>

      <View style={styles.logoRow}>
        <View style={styles.logoWrap}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logo} />
          ) : (
            <Ionicons name="storefront-outline" size={28} color={colors.brand} />
          )}
        </View>
        <Pressable style={styles.secondaryButton} onPress={() => pickImage('logo')}>
          <AppText style={styles.secondaryButtonText}>{text.changeLogo}</AppText>
        </Pressable>
      </View>

      <AppText style={[styles.storeName, textAlign]}>{storeName}</AppText>

      <AppText style={[styles.fieldLabel, textAlign]}>{text.bioAr}</AppText>
      <AppTextInput value={bioAr} onChangeText={setBioAr} multiline style={[styles.input, styles.textArea, textAlign]} />

      <AppText style={[styles.fieldLabel, textAlign]}>{text.bioEn}</AppText>
      <AppTextInput value={bioEn} onChangeText={setBioEn} multiline style={[styles.input, styles.textArea, styles.ltrField]} />

      <Pressable style={[styles.primaryButton, isSaving && styles.buttonDisabled]} onPress={saveStore} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <AppText style={styles.primaryButtonText}>{text.save}</AppText>}
      </Pressable>

      <View style={styles.card}>
        <AppText style={[styles.cardTitle, textAlign]}>{text.subscription}</AppText>
        <AppText style={[styles.statusBadge, textAlign]}>
          {store.accessStatus === 'ACTIVE'
            ? text.statusActive
            : store.accessStatus === 'TRIAL'
              ? text.statusTrial
              : text.statusExpired}
        </AppText>
        {activeSubscription ? (
          <>
            <AppText style={[styles.meta, textAlign]}>
              {text.endsAt}: {activeSubscription.endsAt ? new Date(activeSubscription.endsAt).toLocaleDateString() : '-'}
            </AppText>
            <AppText style={[styles.meta, textAlign]}>
              {text.maxListings}: {effectiveMaxListings}
              {activeSubscription.isTrial ? ` (${text.statusTrial})` : ''}
            </AppText>
            {activeSubscription.isTrial ? (
              <AppText style={[styles.trialHint, textAlign]}>
                {text.trialLimitHint}: {effectiveMaxListings} • {text.paidLimitHint}: {activeSubscription.maxListings}
              </AppText>
            ) : null}
            <AppText style={[styles.meta, textAlign]}>
              {text.listingsUsed}: {listings.length}
            </AppText>
          </>
        ) : null}
        {showPayButton || showRenewButton || showUpgradeButton ? (
          <View style={styles.actionStack}>
            {showPayButton ? (
              <Pressable
                style={[styles.primaryButton, isPaying && styles.buttonDisabled]}
                disabled={isPaying}
                onPress={() => startCheckout('activate-paid')}
              >
                <AppText style={styles.primaryButtonText}>{text.payNow}</AppText>
              </Pressable>
            ) : null}
            {showRenewButton ? (
              <Pressable
                style={[styles.primaryButton, isPaying && styles.buttonDisabled]}
                disabled={isPaying}
                onPress={() => startCheckout('subscribe')}
              >
                <AppText style={styles.primaryButtonText}>{text.renew}</AppText>
              </Pressable>
            ) : null}
            {showUpgradeButton ? (
              <Pressable
                style={[styles.secondaryButton, styles.upgradeButton, isPaying && styles.buttonDisabled]}
                disabled={isPaying}
                onPress={() => setShowUpgradePanel((current) => !current)}
              >
                <AppText style={styles.upgradeButtonText}>
                  {showUpgradePanel ? text.hideUpgrade : text.upgrade}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {showUpgradePanel ? (
          <View style={styles.upgradePanel}>
            <AppText style={[styles.upgradeTitle, textAlign]}>{text.upgradeTitle}</AppText>
            {isLoadingPlans ? (
              <ActivityIndicator color={colors.brand} />
            ) : plans.length === 0 ? (
              <AppText style={[styles.meta, textAlign]}>{text.noPlans}</AppText>
            ) : (
              <>
                {plans.map((plan) => {
                  const selected = selectedUpgradePlanId === plan.id;
                  const planName = locale === 'en' ? plan.nameEn : plan.nameAr;
                  return (
                    <View key={plan.id} style={[styles.planCard, selected && styles.planCardSelected]}>
                      <Pressable onPress={() => setSelectedUpgradePlanId(plan.id)}>
                        <AppText style={[styles.planName, textAlign]}>{planName}</AppText>
                      </Pressable>
                      <View style={styles.billingRow}>
                        {(['MONTHLY', 'YEARLY'] as const).map((period) => {
                          const row = plan.pricing.find((pricing) => pricing.billingPeriod === period);
                          if (!row) return null;
                          const active = selected && upgradeBillingPeriod === period;
                          return (
                            <Pressable
                              key={period}
                              style={[styles.billingChip, active && styles.billingChipActive]}
                              onPress={() => {
                                setSelectedUpgradePlanId(plan.id);
                                setUpgradeBillingPeriod(period);
                              }}
                            >
                              <AppText style={[styles.billingChipLabel, active && styles.billingChipLabelActive]}>
                                {period === 'MONTHLY' ? text.monthly : text.yearly}
                              </AppText>
                              <AppText style={[styles.billingChipPrice, active && styles.billingChipLabelActive]}>
                                {getPlanPrice(plan, period)}
                              </AppText>
                              <AppText style={[styles.billingChipMeta, active && styles.billingChipLabelActive]}>
                                {row.maxListings} {text.maxListings}
                              </AppText>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
                <Pressable
                  style={[styles.darkButton, (isPaying || !selectedUpgradePlanId) && styles.buttonDisabled]}
                  disabled={isPaying || !selectedUpgradePlanId}
                  onPress={() =>
                    startCheckout('subscribe', {
                      planId: selectedUpgradePlanId,
                      billingPeriod: upgradeBillingPeriod
                    })
                  }
                >
                  <AppText style={styles.primaryButtonText}>{text.upgradeSubmit}</AppText>
                </Pressable>
              </>
            )}
          </View>
        ) : null}
      </View>

      {store.subscriptions.length > 0 ? (
        <View style={styles.card}>
          <AppText style={[styles.cardTitle, textAlign]}>{text.subscriptionHistory}</AppText>
          {store.subscriptions.map((subscription) => {
            const planName = locale === 'en' ? subscription.plan?.nameEn : subscription.plan?.nameAr;
            const isCurrent = activeSubscription?.id === subscription.id;
            return (
              <View key={subscription.id} style={[styles.subscriptionRow, isCurrent && styles.subscriptionRowActive]}>
                <AppText style={[styles.listingTitle, textAlign]}>{planName ?? '-'}</AppText>
                <AppText style={[styles.meta, textAlign]}>
                  {text.subscriptionStatus}: {subscription.status}
                  {subscription.isTrial ? ` (${text.statusTrial})` : ''}
                </AppText>
                {subscription.startsAt ? (
                  <AppText style={[styles.meta, textAlign]}>
                    {text.startsAt}: {new Date(subscription.startsAt).toLocaleDateString()}
                  </AppText>
                ) : null}
                {subscription.endsAt ? (
                  <AppText style={[styles.meta, textAlign]}>
                    {text.endsAt}: {new Date(subscription.endsAt).toLocaleDateString()}
                  </AppText>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.dangerCard}>
        <AppText style={[styles.cardTitle, textAlign, styles.dangerTitle]}>{text.deleteStore}</AppText>
        <AppText style={[styles.meta, textAlign]}>{text.deleteConfirm}</AppText>
        <Pressable style={styles.dangerButton} onPress={() => setShowDeleteConfirm(true)}>
          <AppText style={styles.dangerButtonText}>{text.deleteStore}</AppText>
        </Pressable>
      </View>

      <View style={styles.card}>
        <AppText style={[styles.cardTitle, textAlign]}>{text.storeListings}</AppText>
        {listings.length === 0 ? (
          <AppText style={[styles.meta, textAlign]}>{text.noListings}</AppText>
        ) : (
          listings.map((listing) => (
            <Pressable key={listing.id} style={styles.listingRow} onPress={() => onOpenListing(listing.id)}>
              <AppText style={[styles.listingTitle, textAlign]} numberOfLines={1}>
                {listing.title}
              </AppText>
              <AppText style={[styles.meta, textAlign]}>{listing.price ? `${listing.price} ${listing.currency}` : '-'}</AppText>
            </Pressable>
          ))
        )}
      </View>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title={text.deleteStore}
        message={text.deleteConfirm}
        confirmLabel={text.deleteStore}
        cancelLabel={text.cancel}
        destructive
        onConfirm={deleteStore}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyWrap: { gap: 16 },
  emptyText: { color: colors.muted, fontSize: 16, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink },
  subtitle: { color: colors.muted, marginBottom: 8 },
  coverWrap: { height: 160, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#eef2f7', ...shadow },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  coverBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  coverBtnText: { fontWeight: '700', color: colors.brandDark, fontSize: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: -28, paddingHorizontal: 8 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow
  },
  logo: { width: '100%', height: '100%' },
  storeName: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 8 },
  fieldLabel: { fontWeight: '700', color: colors.ink, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff'
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  ltrField: { textAlign: 'left', writingDirection: 'ltr' },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center'
  },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff'
  },
  secondaryButtonText: { fontWeight: '700', color: colors.brandDark },
  buttonDisabled: { opacity: 0.7 },
  card: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
    ...shadow
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  statusBadge: { color: colors.brandDark, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 14 },
  trialHint: {
    color: '#92400e',
    backgroundColor: '#fffbeb',
    borderRadius: radius.md,
    padding: 10,
    fontSize: 13,
    fontWeight: '600'
  },
  actionStack: { gap: 10, marginTop: 8 },
  upgradeButton: { alignItems: 'center' },
  upgradeButtonText: { fontWeight: '800', color: colors.brandDark },
  upgradePanel: { marginTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  upgradeTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  planCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
    backgroundColor: '#fff'
  },
  planCardSelected: { borderColor: colors.brand, backgroundColor: '#f0fdf4' },
  planName: { fontSize: 16, fontWeight: '800', color: colors.ink },
  billingRow: { flexDirection: 'row', gap: 8 },
  billingChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 10,
    gap: 4
  },
  billingChipActive: { borderColor: colors.brand, backgroundColor: '#ecfdf5' },
  billingChipLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  billingChipPrice: { fontSize: 15, fontWeight: '800', color: colors.ink },
  billingChipMeta: { fontSize: 12, color: colors.muted },
  billingChipLabelActive: { color: colors.brandDark },
  darkButton: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center'
  },
  listingRow: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
    marginTop: 4
  },
  listingTitle: { fontWeight: '700', color: colors.ink },
  subscriptionRow: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
    marginTop: 4
  },
  subscriptionRowActive: { borderColor: colors.brand, backgroundColor: '#f0fdf4' },
  dangerCard: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    ...shadow
  },
  dangerTitle: { color: colors.danger },
  dangerButton: {
    marginTop: 4,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center'
  },
  dangerButtonText: { color: '#fff', fontWeight: '800' },
  successBanner: { backgroundColor: '#ecfdf5', borderRadius: radius.md, padding: 12 },
  successText: { color: '#047857', fontWeight: '700' },
  textRtl: { textAlign: 'right', writingDirection: 'rtl' },
  textLtr: { textAlign: 'left', writingDirection: 'ltr' }
});
