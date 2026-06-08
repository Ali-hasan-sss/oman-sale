'use client';

import { Camera, ChevronDown, ChevronUp, Store, Trash2, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import { SiteFooter } from '@/components/home/site-footer';
import { ListingMediaCover } from '@/components/listings/listing-media-cover';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { StorePlanCard, type StorePlanCardData } from '@/components/stores/store-plan-card';
import { MyStorePageSkeleton } from '@/components/stores/my-store-page-skeleton';
import { api } from '@/lib/api';
import { registerMediaPreviewUrl, resolveMediaUrl } from '@/lib/media-url';
import { uploadMediaFile } from '@/lib/media-upload';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';

type StoreSubscription = {
  id: string;
  planId: string;
  status: string;
  isActive: boolean;
  isTrial: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  maxListings: number;
  finalPrice: string | number;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  plan?: {
    id: string;
    nameAr: string;
    nameEn: string;
    trialMaxListings?: number;
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
    renew: 'تجديد الاشتراك',
    activatePaid: 'تفعيل الاشتراك المدفوع',
    payNow: 'الدفع والاستفادة من حدود الخطة',
    upgrade: 'ترقية الخطة',
    upgradeTitle: 'اختر خطة جديدة',
    upgradeSubmit: 'متابعة للترقية',
    hideUpgrade: 'إخفاء الخطط',
    paidLimitHint: 'حد العروض بعد الدفع',
    trialLimitHint: 'حد الفترة التجريبية',
    loadingPlans: 'جاري تحميل الخطط...',
    noPlans: 'لا توجد خطط أخرى متاحة حالياً.',
    billingMonthly: 'شهري',
    billingYearly: 'سنوي',
    freePlan: 'مجاني',
    trialBadge: 'تجربة مجانية',
    trialDays: 'يوم',
    selectPlan: 'اختيار الخطة',
    vatShort: 'ضريبة القيمة المضافة',
    storeListings: 'عروض المتجر',
    noListings: 'لا توجد عروض منشورة من المتجر بعد.',
    addListing: 'إضافة عرض من المتجر',
    loadError: 'تعذر تحميل بيانات المتجر.',
    checkoutError: 'تعذر بدء عملية الدفع.',
    monthly: 'شهري',
    yearly: 'سنوي',
    subscriptionHistory: 'سجل الاشتراكات',
    startsAt: 'يبدأ في',
    subscriptionStatus: 'الحالة',
    deleteStore: 'حذف المتجر',
    deleteConfirm: 'حذف هذا المتجر نهائياً؟ سيتم إخفاء عروضه.',
    deleteError: 'تعذر حذف المتجر.',
    deleted: 'تم حذف المتجر بنجاح.'
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
    renew: 'Renew subscription',
    activatePaid: 'Activate paid subscription',
    payNow: 'Pay to unlock plan limits',
    upgrade: 'Upgrade plan',
    upgradeTitle: 'Choose a new plan',
    upgradeSubmit: 'Continue upgrade',
    hideUpgrade: 'Hide plans',
    paidLimitHint: 'Listing limit after payment',
    trialLimitHint: 'Trial listing limit',
    loadingPlans: 'Loading plans...',
    noPlans: 'No other plans are available right now.',
    billingMonthly: 'Monthly',
    billingYearly: 'Yearly',
    freePlan: 'Free',
    trialBadge: 'Free trial',
    trialDays: 'days',
    selectPlan: 'Select plan',
    vatShort: 'VAT',
    storeListings: 'Store listings',
    noListings: 'No store listings yet.',
    addListing: 'Add store listing',
    loadError: 'Could not load store data.',
    checkoutError: 'Could not start checkout.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    subscriptionHistory: 'Subscription history',
    startsAt: 'Starts on',
    subscriptionStatus: 'Status',
    deleteStore: 'Delete store',
    deleteConfirm: 'Delete this store permanently? Its listings will be hidden.',
    deleteError: 'Could not delete store.',
    deleted: 'Store deleted successfully.'
  }
} as const;

const fallbackImage = '/logo.png';

export function MyStorePage() {
  const router = useRouter();
  const { dir, locale, localizedPath } = useI18n();
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
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [plans, setPlans] = useState<StorePlanCardData[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState('');
  const [upgradeBillingPeriod, setUpgradeBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const effectiveMaxListings = useMemo(() => {
    if (!activeSubscription) return 0;
    if (activeSubscription.isTrial && (activeSubscription.plan?.trialMaxListings ?? 0) > 0) {
      return activeSubscription.plan!.trialMaxListings!;
    }
    return activeSubscription.maxListings;
  }, [activeSubscription]);

  const isOnActiveTrial = Boolean(store?.accessStatus === 'TRIAL' && activeSubscription?.isTrial);
  const canManagePlans = Boolean(store && (store.accessStatus === 'ACTIVE' || store.accessStatus === 'TRIAL'));
  const showPayButton = isOnActiveTrial;
  const showRenewButton = Boolean(store?.requiresPayment && !isOnActiveTrial);
  const showUpgradeButton = canManagePlans;

  const loadPlans = async (rootCategoryId: string) => {
    setIsLoadingPlans(true);
    try {
      const response = await api.get<{ data: StorePlanCardData[] }>('/stores/plans', {
        headers: authHeaders,
        params: { rootCategoryId }
      });
      const nextPlans = response.data.data;
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
  }, []);

  useEffect(() => {
    if (!showUpgradePanel || !store?.rootCategory?.id) return;
    loadPlans(store.rootCategory.id);
  }, [showUpgradePanel, store?.rootCategory?.id]);

  useEffect(() => {
    if (activeSubscription?.billingPeriod) {
      setUpgradeBillingPeriod(activeSubscription.billingPeriod);
    }
  }, [activeSubscription?.billingPeriod]);

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
      const endpoint =
        action === 'activate-paid'
          ? `/stores/${store.id}/activate-paid`
          : `/stores/${store.id}/subscribe`;
      const body =
        action === 'activate-paid'
          ? undefined
          : {
              planId: options?.planId ?? subscription!.planId,
              billingPeriod: options?.billingPeriod ?? subscription!.billingPeriod
            };
      const response = await api.post<{ data: { checkout?: { paymentUrl?: string; activated?: boolean } } }>(
        endpoint,
        body,
        { headers: authHeaders, params: { locale } }
      );
      const checkout = response.data.data.checkout;
      if (checkout?.paymentUrl) {
        window.location.href = checkout.paymentUrl;
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

  const toggleUpgradePanel = () => {
    setShowUpgradePanel((current) => !current);
  };

  const deleteStore = async () => {
    if (!store) return;
    setIsDeleting(true);
    setError('');
    try {
      await api.delete(`/stores/${store.id}`, { headers: authHeaders });
      setShowDeleteConfirm(false);
      router.push(localizedPath('/profile'));
    } catch {
      setError(text.deleteError);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
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
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="mx-auto max-w-6xl px-4 py-10">
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
                  <Link href={localizedPath('/add-listing')} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                    {text.addListing}
                  </Link>
                </div>
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
                  <div className="space-y-3 text-sm text-gray-600">
                    <p className="font-bold text-gray-900">
                      {locale === 'en' ? activeSubscription.plan?.nameEn : activeSubscription.plan?.nameAr}
                    </p>
                    <p>
                      {text.endsAt}: {activeSubscription.endsAt ? new Date(activeSubscription.endsAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-GB') : '-'}
                    </p>
                    <p>
                      {text.maxListings}: {effectiveMaxListings}
                      {activeSubscription.isTrial ? ` (${text.statusTrial})` : ''}
                    </p>
                    {activeSubscription.isTrial ? (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
                        {text.trialLimitHint}: {effectiveMaxListings} • {text.paidLimitHint}: {activeSubscription.maxListings}
                      </p>
                    ) : null}
                    <p>
                      {text.listingsUsed}: {listings.length}
                    </p>
                    <p>
                      {activeSubscription.billingPeriod === 'MONTHLY' ? text.monthly : text.yearly}
                    </p>
                  </div>
                ) : null}

                {showPayButton || showRenewButton || showUpgradeButton ? (
                  <div className="mt-6 space-y-3">
                    {showPayButton ? (
                      <button
                        type="button"
                        disabled={isPaying}
                        onClick={() => startCheckout('activate-paid')}
                        className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-70"
                      >
                        {text.payNow}
                      </button>
                    ) : null}
                    {showRenewButton ? (
                      <button
                        type="button"
                        disabled={isPaying}
                        onClick={() => startCheckout('subscribe')}
                        className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-70"
                      >
                        {text.renew}
                      </button>
                    ) : null}
                    {showUpgradeButton ? (
                      <button
                        type="button"
                        disabled={isPaying}
                        onClick={toggleUpgradePanel}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-600 bg-white px-4 py-3 font-bold text-green-700 disabled:opacity-70"
                      >
                        {showUpgradePanel ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        {showUpgradePanel ? text.hideUpgrade : text.upgrade}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {showUpgradePanel ? (
                  <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-black">{text.upgradeTitle}</h3>
                    {isLoadingPlans ? (
                      <p className="text-sm text-gray-500">{text.loadingPlans}</p>
                    ) : plans.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                        {text.noPlans}
                      </p>
                    ) : (
                      <>
                        <div className="grid gap-4">
                          {plans.map((plan) => (
                            <StorePlanCard
                              key={plan.id}
                              plan={plan}
                              locale={locale}
                              selected={selectedUpgradePlanId === plan.id}
                              billingPeriod={upgradeBillingPeriod}
                              labels={{
                                billingMonthly: text.billingMonthly,
                                billingYearly: text.billingYearly,
                                freePlan: text.freePlan,
                                maxListings: text.maxListings,
                                trialBadge: text.trialBadge,
                                trialDays: text.trialDays,
                                selectPlan: text.selectPlan,
                                vatShort: text.vatShort
                              }}
                              onSelectPlan={setSelectedUpgradePlanId}
                              onSelectBilling={(planId, period) => {
                                setSelectedUpgradePlanId(planId);
                                setUpgradeBillingPeriod(period);
                              }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={isPaying || !selectedUpgradePlanId}
                          onClick={() =>
                            startCheckout('subscribe', {
                              planId: selectedUpgradePlanId,
                              billingPeriod: upgradeBillingPeriod
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-70"
                        >
                          {text.upgradeSubmit}
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {store.subscriptions.length > 0 ? (
                <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
                  <h2 className="mb-4 text-xl font-black">{text.subscriptionHistory}</h2>
                  <div className="space-y-3">
                    {store.subscriptions.map((subscription) => {
                      const planName =
                        locale === 'en' ? subscription.plan?.nameEn : subscription.plan?.nameAr;
                      const isCurrent =
                        activeSubscription?.id === subscription.id;
                      return (
                        <div
                          key={subscription.id}
                          className={`rounded-2xl border p-4 text-sm ${
                            isCurrent ? 'border-green-200 bg-green-50/50' : 'border-gray-100'
                          }`}
                        >
                          <p className="font-bold text-gray-900">{planName ?? '-'}</p>
                          <p className="mt-1 text-gray-600">
                            {text.subscriptionStatus}: {subscription.status}
                            {subscription.isTrial ? ` (${text.statusTrial})` : ''}
                          </p>
                          {subscription.startsAt ? (
                            <p className="text-gray-600">
                              {text.startsAt}:{' '}
                              {new Date(subscription.startsAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
                            </p>
                          ) : null}
                          {subscription.endsAt ? (
                            <p className="text-gray-600">
                              {text.endsAt}:{' '}
                              {new Date(subscription.endsAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
                            </p>
                          ) : null}
                          <p className="text-gray-600">
                            {subscription.billingPeriod === 'MONTHLY' ? text.monthly : text.yearly} • {text.maxListings}:{' '}
                            {subscription.maxListings}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm md:p-8">
                <h2 className="mb-2 text-lg font-black text-red-700">{text.deleteStore}</h2>
                <p className="mb-4 text-sm text-gray-600">{text.deleteConfirm}</p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
                >
                  <Trash2 size={16} />
                  {text.deleteStore}
                </button>
              </div>
            </aside>
          </div>
        )}

        {showDeleteConfirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-black text-slate-900">{text.deleteStore}</h3>
              <p className="mt-2 text-sm text-slate-600">{text.deleteConfirm}</p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={deleteStore}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-60"
                >
                  {isDeleting ? text.saving : text.deleteStore}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
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
