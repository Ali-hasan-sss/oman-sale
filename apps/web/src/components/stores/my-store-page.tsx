'use client';

import { Camera, Store, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { SiteFooter } from '@/components/home/site-footer';
import { ListingMediaCover } from '@/components/listings/listing-media-cover';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { MyStorePageSkeleton } from '@/components/stores/my-store-page-skeleton';
import { StorePlanPickerModal, type StorePlanPickerPlan } from '@/components/stores/store-plan-picker-modal';
import { StoreSubscriptionHistory } from '@/components/stores/store-subscription-history';
import { StoreTrustBadgePanel } from '@/components/trust-badge/store-trust-badge-panel';
import { SubscriptionRingGauge } from '@/components/stores/subscription-ring-gauge';
import { api } from '@/lib/api';
import { resolveApiErrorMessage } from '@/lib/api-errors';
import { registerMediaPreviewUrl, resolveMediaUrl } from '@/lib/media-url';
import { uploadMediaFile } from '@/lib/media-upload';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken, getStoredUser } from '@/lib/user-auth';
import { syncCurrentUser } from '@/lib/sync-current-user';
import { canActivateStorePlanWithoutPayment } from '@/lib/store-plan-activation';
import { filterPlansForUpgrade } from '@/lib/store-plan-upgrade';
import { getBillingPeriodLabel, type StoreBillingPeriod } from '@/lib/store-billing-period';
import {
  canRenewActiveSubscriptionWithinWindow,
  getEffectiveSubscriptionMaxListings,
  getListingsUsageColor,
  getSubscriptionPlanListingAllowance,
  getSubscriptionTimeUsage,
  getTimeUsageColor
} from '@/lib/subscription-usage';

type StoreSubscription = {
  id: string;
  planId: string;
  status: string;
  isActive: boolean;
  isTrial: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  maxListings: number;
  baselineListings?: number;
  finalPrice: string | number;
  billingPeriod: StoreBillingPeriod;
  plan?: {
    id: string;
    nameAr: string;
    nameEn: string;
    trialMaxListings?: number;
    isAdminFree?: boolean;
    sortOrder?: number;
    descriptionAr?: string;
    descriptionEn?: string;
  };
};

type OwnerStore = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  bioAr?: string;
  bioEn?: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  isActive: boolean;
  accessStatus: 'ACTIVE' | 'TRIAL' | 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED' | 'DISABLED';
  requiresPayment: boolean;
  subscriptions: StoreSubscription[];
  rootCategory?: { id?: string; nameAr?: string; nameEn?: string };
};

type StoreListing = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  area?: string | null;
  images?: Array<{ imageUrl: string }>;
  category?: { nameAr?: string; nameEn?: string; name?: string };
};

const labels = {
  ar: {
    title: 'متجري',
    subtitle: 'إدارة صورة المتجر والغلاف ومراقبة الاشتراك وعروض المتجر',
    noStore: 'لا يوجد متجر مرتبط بحسابك.',
    createStore: 'إنشاء متجر',
    storeInfo: 'بيانات المتجر',
    logo: 'شعار المتجر',
    cover: 'غلاف المتجر',
    changeLogo: 'تغيير الشعار',
    changeCover: 'تغيير الغلاف',
    removeLogo: 'إزالة الشعار',
    removeCover: 'إزالة الغلاف',
    bioAr: 'نبذة (عربي)',
    bioEn: 'نبذة (إنجليزي)',
    save: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    saved: 'تم تحديث المتجر بنجاح.',
    saveError: 'تعذر تحديث المتجر.',
    subscription: 'الاشتراك',
    statusActive: 'نشط',
    statusTrial: 'تجريبي',
    statusExpired: 'منتهي',
    statusDisabled: 'معطّل',
    endsAt: 'ينتهي في',
    maxListings: 'حد العروض',
    listingsUsed: 'عروض نشطة',
    listingsConsumed: 'مستهلكة',
    listingsRemaining: 'متبقية',
    listingsUsage: 'استخدام العروض',
    subscriptionTime: 'مدة الاشتراك',
    daysConsumed: 'مستهلكة',
    daysRemaining: 'متبقية',
    dayUnit: 'يوم',
    upgrade: 'ترقية الخطة',
    upgradeTitle: 'ترقية الخطة',
    upgradeSubmit: 'متابعة للترقية',
    upgradeFree: 'تفعيل الخطة مجاناً',
    renewPlan: 'تجديد الخطة',
    renewFree: 'تجديد مجاني',
    paidLimitHint: 'حد العروض بعد الدفع',
    trialLimitHint: 'حد الفترة التجريبية',
    loadingPlans: 'جاري تحميل الخطط...',
    noPlans: 'لا توجد خطط أخرى متاحة حالياً.',
    noPaidUpgradePlans: 'لا توجد خطط مدفوعة أعلى متاحة للترقية حالياً.',
    freePlan: 'مجاناً',
    trialBadge: 'تجربة مجانية',
    trialDays: 'يوم',
    selectPlan: 'اختيار الخطة',
    selectPeriod: 'اختر مدة الاشتراك',
    selectPeriodHint: 'حدّد مدة الاشتراك المناسبة لمتجرك.',
    discount: 'خصم',
    vatShort: 'ضريبة القيمة المضافة',
    storeListings: 'عروض المتجر',
    noListings: 'لا توجد عروض منشورة من المتجر بعد.',
    addListing: 'إضافة عرض من المتجر',
    loadError: 'تعذر تحميل بيانات المتجر.',
    checkoutError: 'تعذر إتمام العملية.',
    adminFreeBadge: 'مجانية (شهر واحد)',
    paymentComingSoon: 'سيتم توفر التفعيل المدفوع قريباً.',
    activateFree: 'تفعيل الاشتراك (مجاني)',
    subscriptionHistory: 'سجل الاشتراكات',
    subscriptionHistoryEmpty: 'لا يوجد سجل اشتراكات بعد.',
    subscriptionHistoryLoading: 'جاري تحميل السجل...',
    loadMoreSubscriptions: 'تحميل الاشتراكات السابقة',
    currentSubscriptionBadge: 'الحالي',
    viewInvoice: 'عرض الفاتورة',
    invoiceTitle: 'فاتورة الاشتراك',
    invoiceNumber: 'رقم الفاتورة',
    invoiceDate: 'تاريخ الفاتورة',
    secondPartyTitle: 'الطرف الثاني',
    storeOwnerLabel: 'صاحب المتجر',
    storeNameLabel: 'اسم المتجر',
    invoiceProduct: 'المنتج',
    unitPrice: 'السعر',
    subtotal: 'المجموع الفرعي',
    vatTotal: 'ضريبة القيمة المضافة (5%)',
    grandTotal: 'المجموع الكلي',
    freeLabel: 'مجاني',
    vatShortLabel: 'ض.ق.م',
    platformInfo: 'معلومات المنصة',
    platformEmail: 'البريد الإلكتروني',
    platformWebsite: 'الموقع الإلكتروني',
    platformTaxNumber: 'الرقم الضريبي',
    platformCommercialRegistration: 'السجل التجاري',
    downloadInvoicePdf: 'تحميل PDF',
    downloadingInvoice: 'جاري التحميل...',
    startsAt: 'يبدأ في',
    subscriptionStatus: 'الحالة',
    cancel: 'إلغاء',
    submitting: 'جاري المعالجة...',
    upgradeConfirmTitle: 'تأكيد ترقية الخطة',
    upgradeConfirmDescription:
      'سيتم إنهاء الاشتراك الحالي وتفعيل الخطة الجديدة. لن تُحذف إعلاناتك السابقة، لكن مستوى التمييز المعروض سيتبع خطة الاشتراك الجديدة فقط.',
    upgradeConfirm: 'تأكيد الترقية',
    listingLimitReached: 'وصلت إلى حد العروض في خطتك الحالية. العروض المنشورة ستبقى ظاهرة، لكن لا يمكن إضافة عروض جديدة إلا بعد حذف بعضها أو ترقية الخطة.',
    listingsBaselineHint: 'عروض سابقة',
    listingsPlanAllowanceHint: 'عروض جديدة في الخطة',
    listingsTotalHint: 'الإجمالي المسموح'
  },
  en: {
    title: 'My Store',
    subtitle: 'Manage your store branding, subscription and store listings',
    noStore: 'You do not have a store yet.',
    createStore: 'Create store',
    storeInfo: 'Store details',
    logo: 'Store logo',
    cover: 'Store cover',
    changeLogo: 'Change logo',
    changeCover: 'Change cover',
    removeLogo: 'Remove logo',
    removeCover: 'Remove cover',
    bioAr: 'Bio (Arabic)',
    bioEn: 'Bio (English)',
    save: 'Save changes',
    saving: 'Saving...',
    saved: 'Store updated successfully.',
    saveError: 'Could not update store.',
    subscription: 'Subscription',
    statusActive: 'Active',
    statusTrial: 'Trial',
    statusExpired: 'Expired',
    statusDisabled: 'Disabled',
    endsAt: 'Ends on',
    maxListings: 'Listing limit',
    listingsUsed: 'Active listings',
    listingsConsumed: 'Used',
    listingsRemaining: 'Remaining',
    listingsUsage: 'Listing usage',
    subscriptionTime: 'Subscription period',
    daysConsumed: 'Elapsed',
    daysRemaining: 'Remaining',
    dayUnit: 'days',
    upgrade: 'Upgrade plan',
    upgradeTitle: 'Upgrade plan',
    upgradeSubmit: 'Continue upgrade',
    upgradeFree: 'Activate plan for free',
    renewPlan: 'Renew plan',
    renewFree: 'Free renewal',
    paidLimitHint: 'Listing limit after payment',
    trialLimitHint: 'Trial listing limit',
    loadingPlans: 'Loading plans...',
    noPlans: 'No other plans are available right now.',
    noPaidUpgradePlans: 'No higher paid plans are available for upgrade right now.',
    freePlan: 'Free',
    trialBadge: 'Free trial',
    trialDays: 'days',
    selectPlan: 'Select plan',
    selectPeriod: 'Choose subscription period',
    selectPeriodHint: 'Pick the subscription period that works best for your store.',
    discount: 'Discount',
    vatShort: 'VAT',
    storeListings: 'Store listings',
    noListings: 'No store listings yet.',
    addListing: 'Add store listing',
    loadError: 'Could not load store data.',
    checkoutError: 'Could not complete the request.',
    adminFreeBadge: 'Free (1 month)',
    paymentComingSoon: 'Paid activation will be available soon.',
    activateFree: 'Activate subscription (free)',
    subscriptionHistory: 'Subscription history',
    subscriptionHistoryEmpty: 'No subscription history yet.',
    subscriptionHistoryLoading: 'Loading history...',
    loadMoreSubscriptions: 'Load previous subscriptions',
    currentSubscriptionBadge: 'Current',
    viewInvoice: 'View invoice',
    invoiceTitle: 'Subscription invoice',
    invoiceNumber: 'Invoice no.',
    invoiceDate: 'Invoice date',
    secondPartyTitle: 'Second party',
    storeOwnerLabel: 'Store owner',
    storeNameLabel: 'Store name',
    invoiceProduct: 'Product',
    unitPrice: 'Price',
    subtotal: 'Subtotal',
    vatTotal: 'VAT (5%)',
    grandTotal: 'Grand total',
    freeLabel: 'Free',
    vatShortLabel: 'VAT',
    platformInfo: 'Platform information',
    platformEmail: 'Email',
    platformWebsite: 'Website',
    platformTaxNumber: 'Tax number',
    platformCommercialRegistration: 'Commercial registration',
    downloadInvoicePdf: 'Download PDF',
    downloadingInvoice: 'Downloading...',
    startsAt: 'Starts on',
    subscriptionStatus: 'Status',
    cancel: 'Cancel',
    submitting: 'Processing...',
    upgradeConfirmTitle: 'Confirm plan upgrade',
    upgradeConfirmDescription:
      'Your current subscription will end and the new plan will be activated. Your existing listings will stay published, but their promotion level will follow the new subscription plan only.',
    upgradeConfirm: 'Confirm upgrade',
    listingLimitReached:
      'You have reached your plan listing limit. Published listings stay visible, but you cannot add new ones until you remove some or upgrade your plan.',
    listingsBaselineHint: 'Previous listings',
    listingsPlanAllowanceHint: 'New listings in plan',
    listingsTotalHint: 'Total allowed'
  }
} as const;

const fallbackImage = '/logo.png';

export function MyStorePage() {
  const router = useRouter();
  const { dir, locale, localizedPath, m } = useI18n();
  const text = labels[locale];
  const [store, setStore] = useState<OwnerStore | null>(null);
  const [listings, setListings] = useState<StoreListing[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [bioAr, setBioAr] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [pendingUpgrade, setPendingUpgrade] = useState<{
    planId: string;
    billingPeriod: StoreBillingPeriod;
  } | null>(null);
  const [plans, setPlans] = useState<StorePlanPickerPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ownerName, setOwnerName] = useState(() => getStoredUser()?.fullName ?? '');

  const authHeaders = useMemo(() => {
    const token = getUserAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, []);

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

  const planListingAllowance = useMemo(() => {
    if (!activeSubscription) return 0;
    return getSubscriptionPlanListingAllowance({
      isTrial: activeSubscription.isTrial,
      maxListings: activeSubscription.maxListings,
      trialMaxListings: activeSubscription.plan?.trialMaxListings
    });
  }, [activeSubscription]);

  const effectiveMaxListings = useMemo(() => {
    if (!activeSubscription) return 0;
    return getEffectiveSubscriptionMaxListings({
      isTrial: activeSubscription.isTrial,
      maxListings: activeSubscription.maxListings,
      baselineListings: activeSubscription.baselineListings,
      trialMaxListings: activeSubscription.plan?.trialMaxListings
    });
  }, [activeSubscription]);

  const listingsUsedCount = listings.length;
  const carriedOverListings = activeSubscription?.baselineListings ?? 0;
  const canAddListing = Boolean(
    activeSubscription &&
      store?.accessStatus !== 'SUBSCRIPTION_EXPIRED' &&
      store?.accessStatus !== 'TRIAL_EXPIRED' &&
      store?.accessStatus !== 'DISABLED' &&
      listingsUsedCount < effectiveMaxListings
  );
  const isAtListingPlanLimit = Boolean(activeSubscription && listingsUsedCount >= effectiveMaxListings);

  const subscriptionTimeUsage = useMemo(() => {
    if (!activeSubscription) return null;
    return getSubscriptionTimeUsage({
      startsAt: activeSubscription.startsAt,
      endsAt: activeSubscription.endsAt,
      billingPeriod: activeSubscription.billingPeriod
    });
  }, [activeSubscription]);

  const isOnActiveTrial = Boolean(store?.accessStatus === 'TRIAL' && activeSubscription?.isTrial);
  const renewReference = store?.subscriptions.find((subscription) => !subscription.isTrial) ?? null;

  const trialCanActivateFree = Boolean(
    activeSubscription?.plan &&
      canActivateStorePlanWithoutPayment(
        activeSubscription.plan,
        activeSubscription.billingPeriod,
        Number(activeSubscription.finalPrice)
      )
  );

  const canRenewFree = Boolean(
    renewReference?.plan &&
      canActivateStorePlanWithoutPayment(
        renewReference.plan,
        renewReference.billingPeriod,
        Number(renewReference.finalPrice)
      )
  );

  const activeNonTrialSubscription =
    activeSubscription && !activeSubscription.isTrial ? activeSubscription : null;

  const canRenewWithinWindow = Boolean(
    activeNonTrialSubscription?.endsAt &&
      canRenewActiveSubscriptionWithinWindow(activeNonTrialSubscription.endsAt)
  );

  const isExpiredRenewal = Boolean(
    store?.requiresPayment && !isOnActiveTrial && !activeNonTrialSubscription
  );

  const showActivateFreeButton = isOnActiveTrial && trialCanActivateFree;
  const showPaymentComingSoonTrial = isOnActiveTrial && !trialCanActivateFree;
  const showRenewButton = Boolean(
    renewReference && !isOnActiveTrial && (isExpiredRenewal || canRenewWithinWindow)
  );
  const showUpgradeButton = Boolean(store && (store.accessStatus === 'ACTIVE' || store.accessStatus === 'TRIAL'));

  const upgradePlans = useMemo(
    () =>
      filterPlansForUpgrade<StorePlanPickerPlan>(
        plans,
        activeSubscription?.plan?.id,
        activeSubscription?.plan?.sortOrder ?? 0
      ),
    [plans, activeSubscription?.plan?.id, activeSubscription?.plan?.sortOrder]
  );

  const pickerLabels = {
    selectPeriod: text.selectPeriod,
    selectPeriodHint: text.selectPeriodHint,
    freePlan: text.freePlan,
    maxListings: text.maxListings,
    vatShort: text.vatShort,
    discount: text.discount,
    trialBadge: text.trialBadge,
    trialDays: text.trialDays,
    adminFreeBadge: text.adminFreeBadge,
    selectPlan: text.selectPlan,
    noPlans: text.noPlans,
    cancel: text.cancel,
    submitting: text.submitting
  };

  const loadPlans = async (rootCategoryId: string) => {
    setIsLoadingPlans(true);
    try {
      const response = await api.get<{ data: StorePlanPickerPlan[] }>('/stores/plans', {
        headers: authHeaders,
        params: { rootCategoryId }
      });
      setPlans(response.data.data);
    } catch {
      setPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const loadStore = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await api.get<{ data: OwnerStore[] }>('/stores/me', { headers: authHeaders });
      const nextStore = response.data.data.find((item) => item.isActive) ?? response.data.data[0] ?? null;
      setStore(nextStore);
      if (nextStore) {
        setLogoUrl(nextStore.logoUrl ?? null);
        setCoverUrl(nextStore.coverUrl ?? null);
        setBioAr(nextStore.bioAr ?? '');
        setBioEn(nextStore.bioEn ?? '');
        const adsResponse = await api.get<{ data: { items: StoreListing[] } }>(`/stores/${nextStore.id}/ads`, {
          headers: authHeaders,
          params: { page: 1, limit: 20 }
        });
        setListings(adsResponse.data.data.items);
      }
    } catch {
      setError(text.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getUserAccessToken();
    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }
    loadStore();
    void syncCurrentUser(token).then((user) => {
      if (user?.fullName) setOwnerName(user.fullName);
    });
  }, []);

  useEffect(() => {
    if (!upgradeModalOpen || !store?.rootCategory?.id) return;
    loadPlans(store.rootCategory.id);
  }, [upgradeModalOpen, store?.rootCategory?.id]);

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, target: 'logo' | 'cover') => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const result = await uploadMediaFile(file, 'stores');
      registerMediaPreviewUrl(result.key, result.url);
      if (target === 'logo') setLogoUrl(result.key);
      else setCoverUrl(result.key);
    } catch {
      setError(text.saveError);
    }
  };

  const saveStore = async (event: FormEvent) => {
    event.preventDefault();
    if (!store) return;
    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      const response = await api.patch<{ data: OwnerStore }>(
        `/stores/${store.id}`,
        { logoUrl: logoUrl ?? undefined, coverUrl: coverUrl ?? undefined, bioAr, bioEn },
        { headers: authHeaders }
      );
      setStore((current) => (current ? { ...current, ...response.data.data } : current));
      setMessage(text.saved);
    } catch {
      setError(text.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubscriptionAction = async (
    endpoint: 'activate-paid' | 'subscribe' | 'renew-subscription',
    options?: { planId: string; billingPeriod: StoreBillingPeriod }
  ) => {
    if (!store) return;

    setIsPaying(true);
    setError('');
    try {
      const path =
        endpoint === 'activate-paid'
          ? `/stores/${store.id}/activate-paid`
          : endpoint === 'renew-subscription'
            ? `/stores/${store.id}/renew-subscription`
            : `/stores/${store.id}/subscribe`;

      const body =
        endpoint === 'subscribe' && options
          ? { planId: options.planId, billingPeriod: options.billingPeriod }
          : undefined;

      const response = await api.post<{ data: { checkout?: { paymentUrl?: string; activated?: boolean } } }>(
        path,
        body,
        { headers: authHeaders, params: { locale } }
      );

      const checkout = response.data.data.checkout;
      if (checkout?.paymentUrl) {
        window.location.href = checkout.paymentUrl;
        return;
      }

      setUpgradeModalOpen(false);
      await loadStore();
    } catch (actionError) {
      setError(
        resolveApiErrorMessage(
          actionError,
          {
            PAYMENT_COMING_SOON: m.errors.PAYMENT_COMING_SOON,
            SUBSCRIPTION_RENEWAL_TOO_EARLY: m.errors.SUBSCRIPTION_RENEWAL_TOO_EARLY,
            SUBSCRIPTION_FREE_PLAN_UPGRADE_NOT_ALLOWED: m.errors.SUBSCRIPTION_FREE_PLAN_UPGRADE_NOT_ALLOWED,
            SUBSCRIPTION_SAME_PLAN_NOT_ALLOWED: m.errors.SUBSCRIPTION_SAME_PLAN_NOT_ALLOWED,
            SUBSCRIPTION_DOWNGRADE_NOT_ALLOWED: m.errors.SUBSCRIPTION_DOWNGRADE_NOT_ALLOWED
          },
          text.checkoutError
        )
      );
    } finally {
      setIsPaying(false);
    }
  };

  const openUpgradeModal = () => {
    setError('');
    setUpgradeModalOpen(true);
  };

  const statusLabel = (status: OwnerStore['accessStatus']) => {
    if (status === 'ACTIVE') return text.statusActive;
    if (status === 'TRIAL') return text.statusTrial;
    if (status === 'DISABLED') return text.statusDisabled;
    return text.statusExpired;
  };

  const storeName = store ? (locale === 'en' ? store.nameEn : store.nameAr) : '';
  const inputClass = 'w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500';

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="site-container site-page-main site-page-main--wide min-w-0">
        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 to-slate-900 p-8 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              <Store size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black">{text.title}</h1>
              <p className="text-white/80">{text.subtitle}</p>
            </div>
          </div>
        </section>

        {isLoading ? (
          <MyStorePageSkeleton />
        ) : !store ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="mb-6 text-gray-600">{text.noStore}</p>
            <Link href={localizedPath('/stores/create')} className="inline-flex rounded-xl bg-green-600 px-6 py-3 font-bold text-white">
              {text.createStore}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <form onSubmit={saveStore} className="space-y-6">
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
                <div className="relative h-48 bg-slate-100">
                  <img src={coverUrl ? resolveMediaUrl(coverUrl) : fallbackImage} alt={storeName} className={`h-full w-full ${coverUrl ? 'object-cover' : 'object-contain p-8'}`} />
                  <label className="absolute bottom-4 end-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-sm font-bold shadow">
                    <Upload size={16} />
                    {text.changeCover}
                    <input type="file" accept="image/*" onChange={(event) => uploadImage(event, 'cover')} className="hidden" />
                  </label>
                  {coverUrl ? (
                    <button type="button" onClick={() => setCoverUrl(null)} className="absolute top-4 start-4 rounded-xl bg-white/95 px-4 py-2 text-sm font-bold shadow">
                      {text.removeCover}
                    </button>
                  ) : null}
                </div>
                <div className="p-6 md:p-8">
                  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="relative -mt-16 h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-white shadow">
                      <img src={logoUrl ? resolveMediaUrl(logoUrl) : fallbackImage} alt={storeName} className={`h-full w-full ${logoUrl ? 'object-cover' : 'object-contain p-3'}`} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white">
                        <Camera size={16} />
                        {text.changeLogo}
                        <input type="file" accept="image/*" onChange={(event) => uploadImage(event, 'logo')} className="hidden" />
                      </label>
                      {logoUrl ? (
                        <button type="button" onClick={() => setLogoUrl(null)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">
                          <X size={16} />
                          {text.removeLogo}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <h2 className="mb-2 text-2xl font-black">{storeName}</h2>
                  <p className="mb-6 text-sm text-slate-500">
                    {(locale === 'en' ? store.rootCategory?.nameEn : store.rootCategory?.nameAr) ?? ''}
                  </p>

                  <div className="grid gap-5">
                    <Field label={text.bioAr}>
                      <textarea value={bioAr} onChange={(event) => setBioAr(event.target.value)} className={`${inputClass} min-h-28 resize-none`} maxLength={2000} />
                    </Field>
                    <Field label={text.bioEn}>
                      <textarea value={bioEn} onChange={(event) => setBioEn(event.target.value)} className={`${inputClass} min-h-28 resize-none`} maxLength={2000} dir="ltr" />
                    </Field>
                  </div>

                  {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
                  {message ? <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</p> : null}

                  <button type="submit" disabled={isSaving} className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-bold text-white disabled:opacity-70">
                    {isSaving ? text.saving : text.save}
                  </button>
                </div>
              </div>

              <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-black">{text.storeListings}</h2>
                  {canAddListing ? (
                    <Link href={localizedPath('/add-listing')} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                      {text.addListing}
                    </Link>
                  ) : (
                    <span className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-500" title={text.listingLimitReached}>
                      {text.addListing}
                    </span>
                  )}
                </div>
                {isAtListingPlanLimit ? (
                  <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {text.listingLimitReached}
                  </p>
                ) : null}
                {listings.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-gray-500">{text.noListings}</p>
                ) : (
                  <div className="space-y-4">
                    {listings.map((listing) => {
                      const categoryName =
                        (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) ?? listing.category?.name ?? '';
                      return (
                        <Link
                          key={listing.id}
                          href={localizedPath(`/listing/${listing.id}`)}
                          className="flex gap-4 rounded-2xl border border-gray-100 p-4 transition hover:border-green-200 hover:bg-green-50/40"
                        >
                          <ListingMediaCover
                            items={listing.images}
                            alt={listing.title}
                            fallbackSrc={fallbackImage}
                            className="h-24 w-28 shrink-0 rounded-xl"
                            imageClassName="h-24 w-28 rounded-xl"
                          />
                          <div>
                            <h3 className="font-bold">{listing.title}</h3>
                            <p className="text-sm text-gray-500">{categoryName}</p>
                            <p className="mt-1 font-bold text-green-600">
                              {listing.price ? `${listing.price} ${listing.currency}` : '-'}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </form>

            <aside className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
                <h2 className="mb-4 text-2xl font-black">{text.subscription}</h2>
                <div className="mb-4 inline-flex rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                  {statusLabel(store.accessStatus)}
                </div>
                {activeSubscription ? (
                  <div className="space-y-4 text-sm text-gray-600">
                    <div>
                      <p className="font-bold text-gray-900">
                        {locale === 'en' ? activeSubscription.plan?.nameEn : activeSubscription.plan?.nameAr}
                      </p>
                      <p className="mt-1">
                        {getBillingPeriodLabel(activeSubscription.billingPeriod, locale)}
                        {activeSubscription.isTrial ? ` • ${text.statusTrial}` : ''}
                      </p>
                      <p className="mt-1">
                        {text.endsAt}:{' '}
                        {activeSubscription.endsAt
                          ? new Date(activeSubscription.endsAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-GB')
                          : '-'}
                      </p>
                    </div>

                    {activeSubscription.isTrial ? (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
                        {text.trialLimitHint}: {planListingAllowance} • {text.paidLimitHint}: {activeSubscription.maxListings}
                      </p>
                    ) : null}

                    {carriedOverListings > 0 ? (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                        {text.listingsBaselineHint}: {carriedOverListings} + {text.listingsPlanAllowanceHint}:{' '}
                        {planListingAllowance} = {text.listingsTotalHint}: {effectiveMaxListings}
                      </p>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3">
                      <SubscriptionRingGauge
                        title={text.listingsUsage}
                        used={listingsUsedCount}
                        total={effectiveMaxListings}
                        usedLabel={text.listingsConsumed}
                        remainingLabel={text.listingsRemaining}
                        centerValue={`${Math.max(effectiveMaxListings - listingsUsedCount, 0)}`}
                        centerSub={text.listingsRemaining}
                        accentColor={getListingsUsageColor(listingsUsedCount, effectiveMaxListings)}
                      />
                      {subscriptionTimeUsage ? (
                        <SubscriptionRingGauge
                          title={text.subscriptionTime}
                          used={subscriptionTimeUsage.elapsedDays}
                          total={subscriptionTimeUsage.totalDays}
                          usedLabel={text.daysConsumed}
                          remainingLabel={text.daysRemaining}
                          centerValue={`${subscriptionTimeUsage.remainingDays}`}
                          centerSub={text.dayUnit}
                          accentColor={getTimeUsageColor(subscriptionTimeUsage.elapsedRatio)}
                        />
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {showPaymentComingSoonTrial ? (
                  <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {text.paymentComingSoon}
                  </p>
                ) : null}

                <div className="mt-6 space-y-3">
                  {showActivateFreeButton ? (
                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={() => handleSubscriptionAction('activate-paid')}
                      className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-70"
                    >
                      {text.activateFree}
                    </button>
                  ) : null}

                  {showRenewButton ? (
                    <>
                      {!canRenewFree ? (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          {text.paymentComingSoon}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        disabled={isPaying || !canRenewFree}
                        onClick={() => handleSubscriptionAction('renew-subscription')}
                        className="w-full rounded-xl border border-green-600 bg-white px-4 py-3 font-bold text-green-700 disabled:opacity-60"
                      >
                        {canRenewFree ? text.renewFree : text.renewPlan}
                      </button>
                    </>
                  ) : null}

                  {showUpgradeButton ? (
                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={openUpgradeModal}
                      className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-70"
                    >
                      {text.upgrade}
                    </button>
                  ) : null}
                </div>
              </div>

              <StoreTrustBadgePanel storeId={store.id} />

              <StoreSubscriptionHistory
                storeId={store.id}
                locale={locale}
                activeSubscriptionId={activeSubscription?.id}
                userName={ownerName}
                storeName={storeName}
                authHeaders={authHeaders}
                labels={{
                  title: text.subscriptionHistory,
                  startsAt: text.startsAt,
                  endsAt: text.endsAt,
                  maxListings: text.maxListings,
                  loadMore: text.loadMoreSubscriptions,
                  loading: text.subscriptionHistoryLoading,
                  empty: text.subscriptionHistoryEmpty,
                  currentBadge: text.currentSubscriptionBadge,
                  viewInvoice: text.viewInvoice,
                  invoice: {
                    title: text.invoiceTitle,
                    invoiceNumber: text.invoiceNumber,
                    invoiceDate: text.invoiceDate,
                    secondPartyTitle: text.secondPartyTitle,
                    storeOwnerLabel: text.storeOwnerLabel,
                    storeNameLabel: text.storeNameLabel,
                    product: text.invoiceProduct,
                    unitPrice: text.unitPrice,
                    subtotal: text.subtotal,
                    vatTotal: text.vatTotal,
                    grandTotal: text.grandTotal,
                    free: text.freeLabel,
                    maxListings: text.maxListings,
                    platformInfo: text.platformInfo,
                    email: text.platformEmail,
                    website: text.platformWebsite,
                    taxNumber: text.platformTaxNumber,
                    commercialRegistration: text.platformCommercialRegistration,
                    downloadPdf: text.downloadInvoicePdf,
                    downloading: text.downloadingInvoice,
                    close: text.cancel
                  }
                }}
              />
            </aside>
          </div>
        )}

        <StorePlanPickerModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          title={text.upgradeTitle}
          submitLabel={text.upgradeSubmit}
          freeSubmitLabel={text.upgradeFree}
          paymentComingSoonLabel={text.paymentComingSoon}
          locale={locale}
          plans={upgradePlans}
          isLoading={isLoadingPlans}
          isSubmitting={isPaying}
          paidOnly
          noPlansHint={text.noPaidUpgradePlans}
          labels={pickerLabels}
          onSubmit={(planId, billingPeriod) => setPendingUpgrade({ planId, billingPeriod })}
        />

        {pendingUpgrade ? (
          <ConfirmationDialog
            title={text.upgradeConfirmTitle}
            description={text.upgradeConfirmDescription}
            confirmLabel={text.upgradeConfirm}
            cancelLabel={text.cancel}
            isConfirming={isPaying}
            onCancel={() => setPendingUpgrade(null)}
            onConfirm={() => {
              const selection = pendingUpgrade;
              setPendingUpgrade(null);
              handleSubscriptionAction('subscribe', selection);
            }}
          />
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
