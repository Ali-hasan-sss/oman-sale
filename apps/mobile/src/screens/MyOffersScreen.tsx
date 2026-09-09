import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorNotice } from '../components/ErrorNotice';
import { ListingCard } from '../components/ListingCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ListingListSkeleton } from '../components/skeleton';
import { formatListingDate, formatPrice } from '../data';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { rowDirection } from '../lib/layout-direction';
import { buildBannerAdWebsitePath, openWebPaymentPage, openWebsitePage } from '../lib/open-external-web';
import { getWilayahsForGovernorate, omanGovernorates } from '../lib/oman-locations';
import { formatPlanVatBreakdown } from '../lib/plan-pricing';
import {
  deleteListingRequest,
  markListingSoldRequest,
  unmarkListingSoldRequest,
  updateListingRequest
} from '../services/listings.service';
import {
  fetchPromotionPlans,
  getPlanPrice,
  promoteAdRequest,
  type PromotionPlan
} from '../services/promotions.service';
import { useAuthStore, useListingsStore } from '../stores';
import { colors, radius, shadow } from '../theme';
import type { Listing } from '../types';

type MyOffersScreenProps = {
  onListingPress: (listingId: string) => void;
  onStorePress?: (slug: string) => void;
};

export function MyOffersScreen({ onListingPress, onStorePress }: MyOffersScreenProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const listings = useListingsStore((state) => state.my);
  const isLoading = useListingsStore((state) => state.isLoadingMy);
  const isRefreshing = useListingsStore((state) => state.isRefreshingMy);
  const hasLoadedMy = useListingsStore((state) => state.hasLoadedMy);
  const loadMy = useListingsStore((state) => state.loadMy);
  const resetMy = useListingsStore((state) => state.resetMy);
  const text = t.myOffers;
  const textAlign = isRtl ? styles.rtl : styles.ltr;

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Listing | null>(null);
  const [promoting, setPromoting] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [plans, setPlans] = useState<PromotionPlan[]>([]);

  useEffect(() => {
    if (!accessToken) {
      resetMy();
      return;
    }
    loadMy({ refresh: useListingsStore.getState().hasLoadedMy }).catch(() => undefined);
    fetchPromotionPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, [accessToken, locale, loadMy, resetMy]);

  const handleRefresh = useCallback(() => {
    loadMy({ refresh: true }).catch(() => undefined);
  }, [loadMy]);

  const toggleSold = async (listing: Listing) => {
    setError('');
    try {
      if (listing.isSold) await unmarkListingSoldRequest(listing.id);
      else await markListingSoldRequest(listing.id);
      await loadMy({ refresh: true });
    } catch {
      setError(text.actionError);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    setError('');
    try {
      await deleteListingRequest(deleting.id);
      setDeleting(null);
      await loadMy({ refresh: true });
    } catch {
      setError(text.actionError);
    } finally {
      setIsDeleting(false);
    }
  };

  const showSkeleton = isLoading && !hasLoadedMy;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.brand]} tintColor={colors.brand} />
      }
    >
      <AppText style={[styles.title, textAlign]}>{text.title}</AppText>
      <AppText style={[styles.subtitle, textAlign]}>{text.subtitle}</AppText>
      {message ? (
        <View style={styles.successBanner}>
          <AppText style={[styles.successText, textAlign]}>{message}</AppText>
        </View>
      ) : null}
      {error ? <ErrorNotice message={error} onDismiss={() => setError('')} /> : null}
      {showSkeleton ? (
        <ListingListSkeleton count={4} />
      ) : listings.length === 0 ? (
        <EmptyState message={text.empty} />
      ) : (
        listings.map((listing) => {
          const expiresLabel = listing.expiresAt
            ? `${text.expiresIn} ${Math.max(
                0,
                Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              )} ${text.days}`
            : text.noExpiry;

          return (
            <View key={listing.id} style={styles.managedCard}>
              <ListingCard
                listing={listing}
                locale={locale}
                featuredLabel={t.common.featured}
                embedded
                onPress={() => onListingPress(listing.id)}
                onStorePress={onStorePress}
              />
              <View style={styles.cardFooter}>
                <View style={[styles.metaRow, rowDirection(isRtl)]}>
                  {listing.isSold ? <AppText style={styles.sold}>{text.soldBadge}</AppText> : null}
                  {listing.isActive === false ? <AppText style={styles.inactive}>{text.inactiveBadge}</AppText> : null}
                  <AppText style={styles.metaChip}>
                    {listing.promotion ? listing.promotion.plan?.badgeLabel || text.featuredAd : text.normalAd}
                  </AppText>
                  <AppText style={styles.metaChip}>
                    {listing.views ?? 0} {text.views}
                  </AppText>
                  {listing.createdAt ? (
                    <AppText style={styles.metaChip}>
                      {text.publishedAt}: {formatListingDate(listing.createdAt, locale)}
                    </AppText>
                  ) : null}
                  <AppText style={styles.metaChip}>{expiresLabel}</AppText>
                </View>
                <View style={[styles.actions, rowDirection(isRtl)]}>
                  <ActionChip icon="eye-outline" label={text.view} onPress={() => onListingPress(listing.id)} />
                  <ActionChip icon="create-outline" label={text.edit} onPress={() => setEditing(listing)} />
                  <ActionChip icon="trending-up-outline" label={text.promote} onPress={() => setPromoting(listing)} />
                  <ActionChip
                    icon="images-outline"
                    label={t.common.requestBannerAd}
                    onPress={() =>
                      void openWebsitePage(
                        locale,
                        buildBannerAdWebsitePath({
                          listingId: listing.id,
                          title: listing.title,
                          imageUrl: listing.images?.[0]?.imageUrl
                        })
                      )
                    }
                  />
                  <ActionChip
                    icon="checkmark-circle-outline"
                    label={listing.isSold ? text.unmarkSold : text.markSold}
                    onPress={() => void toggleSold(listing)}
                  />
                  <ActionChip icon="trash-outline" label={text.delete} danger onPress={() => setDeleting(listing)} />
                </View>
              </View>
            </View>
          );
        })
      )}
      {isRefreshing && listings.length > 0 ? <ActivityIndicator color={colors.brand} style={styles.refreshHint} /> : null}

      {editing ? (
        <EditListingModal
          listing={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            setMessage(text.updateSuccess);
            await loadMy({ refresh: true });
          }}
          onError={() => setError(text.actionError)}
        />
      ) : null}

      {promoting ? (
        <PromoteListingModal
          listing={promoting}
          plans={plans}
          onClose={() => setPromoting(null)}
          onSaved={async () => {
            setPromoting(null);
            setMessage(text.promoteSuccess);
            await loadMy({ refresh: true });
          }}
          onPaymentOpened={() => {
            setPromoting(null);
            setMessage(text.paymentOpened);
          }}
          onError={() => setError(text.actionError)}
        />
      ) : null}

      <ConfirmDialog
        visible={Boolean(deleting)}
        title={text.confirmDeleteTitle}
        message={text.confirmDeleteDescription}
        confirmLabel={isDeleting ? text.saving : text.confirmDeleteAction}
        cancelLabel={t.common.cancel}
        destructive
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </ScrollView>
  );
}

function ActionChip({
  icon,
  label,
  onPress,
  danger
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { isRtl } = useI18n();
  return (
    <Pressable
      style={[styles.actionChip, rowDirection(isRtl), danger && styles.actionChipDanger]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={16} color={danger ? colors.danger : colors.brandDark} />
      <AppText style={[styles.actionChipText, danger && styles.actionChipTextDanger]}>{label}</AppText>
    </Pressable>
  );
}

function EditListingModal({
  listing,
  onClose,
  onSaved,
  onError
}: {
  listing: Listing;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: () => void;
}) {
  const { locale, t, isRtl } = useI18n();
  const text = t.myOffers;
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description ?? '');
  const [price, setPrice] = useState(listing.price != null ? String(listing.price) : '');
  const [city, setCity] = useState(listing.city ?? '');
  const [wilayah, setWilayah] = useState(listing.wilayah ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const wilayahOptions = useMemo(() => (city ? getWilayahsForGovernorate(city) : []), [city]);
  const textAlign = isRtl ? styles.rtl : styles.ltr;

  const submit = async () => {
    setIsSaving(true);
    try {
      await updateListingRequest(listing.id, {
        title,
        description,
        price: price ? Number(price) : undefined,
        city: city || undefined,
        wilayah: wilayah || undefined
      });
      await onSaved();
    } catch {
      onError();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <ScrollView style={styles.modalCard} contentContainerStyle={styles.modalContent}>
          <AppText style={[styles.modalTitle, textAlign]}>{text.editTitle}</AppText>
          <AppText style={[styles.fieldLabel, textAlign]}>{t.addOffer.titleField}</AppText>
          <AppTextInput value={title} onChangeText={setTitle} style={styles.input} />
          <AppText style={[styles.fieldLabel, textAlign]}>{t.addOffer.description}</AppText>
          <AppTextInput value={description} onChangeText={setDescription} multiline style={[styles.input, styles.textarea]} />
          <AppText style={[styles.fieldLabel, textAlign]}>{t.addOffer.price}</AppText>
          <AppTextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={styles.input} />
          <AppText style={[styles.fieldLabel, textAlign]}>{t.addOffer.city}</AppText>
          <ScrollView horizontal contentContainerStyle={[styles.chipRow, rowDirection(isRtl)]}>
            {omanGovernorates.map((item) => (
              <Pressable
                key={item.value}
                style={[styles.chip, city === item.value && styles.chipActive]}
                onPress={() => {
                  setCity(item.value);
                  setWilayah('');
                }}
              >
                <AppText style={[styles.chipText, city === item.value && styles.chipTextActive]}>
                  {locale === 'en' ? item.en : item.ar}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
          {city ? (
            <>
              <AppText style={[styles.fieldLabel, textAlign]}>{t.addOffer.wilayah}</AppText>
              <ScrollView horizontal contentContainerStyle={[styles.chipRow, rowDirection(isRtl)]}>
                {wilayahOptions.map((item) => (
                  <Pressable
                    key={item.value}
                    style={[styles.chip, wilayah === item.value && styles.chipActive]}
                    onPress={() => setWilayah(item.value)}
                  >
                    <AppText style={[styles.chipText, wilayah === item.value && styles.chipTextActive]}>
                      {locale === 'en' ? item.en : item.ar}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <AppText style={styles.cancelText}>{t.common.cancel}</AppText>
            </Pressable>
            <PrimaryButton label={isSaving ? text.saving : text.save} onPress={() => void submit()} loading={isSaving} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PromoteListingModal({
  listing,
  plans,
  onClose,
  onSaved,
  onPaymentOpened,
  onError
}: {
  listing: Listing;
  plans: PromotionPlan[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  onPaymentOpened: () => void;
  onError: () => void;
}) {
  const { locale, t, isRtl } = useI18n();
  const text = t.myOffers;
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');
  const [days, setDays] = useState(7);
  const [isSaving, setIsSaving] = useState(false);
  const selectedPlan = plans.find((plan) => plan.id === planId);
  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const durationOptions = [
    { days: 7, label: t.addOffer.oneWeek },
    { days: 14, label: t.addOffer.twoWeeks },
    { days: 30, label: t.addOffer.oneMonth }
  ];

  const submit = async () => {
    if (!planId) return;
    setIsSaving(true);
    try {
      const result = await promoteAdRequest({ adId: listing.id, planId, days }, locale);
      if (result.checkout?.paymentUrl) {
        await openWebPaymentPage(result.checkout.paymentUrl);
        onPaymentOpened();
        return;
      }
      await onSaved();
    } catch {
      onError();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <ScrollView style={styles.modalCard} contentContainerStyle={styles.modalContent}>
          <AppText style={[styles.modalTitle, textAlign]}>{text.promoteTitle}</AppText>
          <AppText style={[styles.fieldLabel, textAlign]}>{formatPrice(listing.price, listing.currency, locale)}</AppText>
          {plans.map((plan) => {
            const active = plan.id === planId;
            const pricing = formatPlanVatBreakdown(getPlanPrice(plan, days), locale, {
              free: t.common.pricing.free,
              vatShort: t.common.pricing.vatShort
            });
            return (
              <Pressable key={plan.id} style={[styles.planCard, active && styles.planCardActive]} onPress={() => setPlanId(plan.id)}>
                <AppText style={styles.planName}>{locale === 'en' ? plan.nameEn : plan.nameAr}</AppText>
                <AppText style={styles.planPrice}>{pricing.main}</AppText>
              </Pressable>
            );
          })}
          <View style={[styles.chipRow, rowDirection(isRtl)]}>
            {durationOptions.map((option) => (
              <Pressable
                key={option.days}
                style={[styles.chip, days === option.days && styles.chipActive]}
                onPress={() => setDays(option.days)}
              >
                <AppText style={[styles.chipText, days === option.days && styles.chipTextActive]}>{option.label}</AppText>
              </Pressable>
            ))}
          </View>
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <AppText style={styles.cancelText}>{t.common.cancel}</AppText>
            </Pressable>
            <PrimaryButton
              label={isSaving ? text.saving : text.promoteNow}
              onPress={() => void submit()}
              loading={isSaving}
              disabled={!selectedPlan}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '900', color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 6, marginBottom: 16 },
  successBanner: {
    backgroundColor: '#ecfdf5',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  successText: { color: colors.brandDark, fontWeight: '800' },
  refreshHint: { marginTop: 12 },
  managedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 16,
    ...shadow
  },
  cardFooter: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  metaRow: { flexWrap: 'wrap', gap: 8 },
  metaChip: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden'
  },
  sold: {
    color: '#92400e',
    backgroundColor: '#fef3c7',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: '800',
    fontSize: 12
  },
  inactive: {
    color: colors.danger,
    backgroundColor: '#fef2f2',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: '800',
    fontSize: 12
  },
  actions: { flexWrap: 'wrap', gap: 8 },
  actionChip: {
    flexGrow: 1,
    minWidth: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  actionChipDanger: { backgroundColor: '#fef2f2' },
  actionChipText: { color: colors.brandDark, fontWeight: '800', fontSize: 12, textAlign: 'center' },
  actionChipTextDanger: { color: colors.danger },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 16 },
  modalCard: { maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radius.lg },
  modalContent: { padding: 16, gap: 8 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.ink, marginBottom: 8 },
  fieldLabel: { fontWeight: '800', color: colors.ink, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  chipRow: { flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontWeight: '700', color: colors.ink, fontSize: 12 },
  chipTextActive: { color: '#fff' },
  modalActions: { gap: 8, marginTop: 12 },
  cancelButton: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { fontWeight: '800', color: colors.muted },
  planCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12 },
  planCardActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  planName: { fontWeight: '800', color: colors.ink },
  planPrice: { marginTop: 4, fontWeight: '800', color: colors.brandDark },
  rtl: { textAlign: 'right' },
  ltr: { textAlign: 'left' }
});
