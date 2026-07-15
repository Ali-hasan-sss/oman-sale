'use client';

import { Calendar, CheckCircle2, Clock, Eye, Megaphone, Pen, Trash2, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { PlanPriceWithVat } from '@/components/pricing/plan-price-with-vat';
import { getListingLocationLabel, getWilayahsForGovernorate, omanGovernorates } from '@/lib/oman-locations';
import { getUserAccessToken } from '@/lib/user-auth';
import { buildBannerAdRequestUrl } from '@/lib/banner-ad-prefill';
import { consumeListingPaymentReturn, freshFetchHeaders, freshFetchParams } from '@/lib/payment-return';
import { storePendingThawaniSession } from '@/lib/thawani-session';
import { useAuthStore } from '@/store/auth-store';
import { ListingTitleWithVerified } from '@/components/trust-badge/listing-verified-badge';
import { ListingCardsSkeleton } from './listing-card-skeleton';
import { ListingMediaCover } from './listing-media-cover';

type ListingImage = {
  imageUrl: string;
};

type MyListing = {
  id: string;
  title: string;
  description: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  wilayah?: string | null;
  area?: string | null;
  contactPhone?: string | null;
  views: number;
  status: string;
  isApproved: boolean;
  isActive: boolean;
  isSold: boolean;
  createdAt: string;
  expiresAt?: string | null;
  images: ListingImage[];
  category?: {
    name?: string;
    nameAr?: string;
    nameEn?: string;
  } | null;
  promotion?: {
    id: string;
    endsAt: string;
    plan?: {
      badgeLabel?: string | null;
      nameAr?: string;
      nameEn?: string;
      color?: string | null;
    } | null;
  } | null;
  trustBadgeApproved?: boolean;
};

type PromotionPlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  weekPrice: string | number;
  twoWeeksPrice: string | number;
  monthPrice: string | number;
  color?: string | null;
};

const fallbackImage = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop';

const labels = {
  ar: {
    title: 'إعلاناتي',
    subtitle: 'قم بإدارة وترقية إعلاناتك',
    normalAd: 'إعلان عادي',
    featuredAd: 'إعلان مميز',
    views: 'مشاهدة',
    publishedAt: 'تم النشر:',
    expiresIn: 'ينتهي في',
    days: 'يوم',
    noExpiry: 'بدون تاريخ انتهاء',
    view: 'عرض',
    edit: 'تعديل',
    promote: 'ترقية',
    promoteBanner: 'ترويج بالبنر',
    delete: 'حذف',
    loading: 'جاري تحميل إعلاناتك...',
    empty: 'لا توجد إعلانات خاصة بك حاليًا.',
    editTitle: 'تعديل الإعلان',
    promoteTitle: 'ترقية الإعلان',
    adTitle: 'عنوان الإعلان',
    description: 'الوصف',
    price: 'السعر',
    city: 'المحافظة',
    selectCity: 'اختر المحافظة',
    wilayah: 'الولاية / المنطقة',
    selectWilayah: 'اختر الولاية',
    contactPhone: 'رقم التواصل',
    save: 'حفظ التعديلات',
    saving: 'جاري الحفظ...',
    cancel: 'إلغاء',
    selectPlan: 'اختر خطة الترويج',
    duration: 'المدة',
    oneWeek: 'أسبوع',
    twoWeeks: 'أسبوعان',
    oneMonth: 'شهر',
    promoteNow: 'ترقية الآن',
    vatShort: 'ضريبة القيمة المضافة',
    free: 'مجاني',
    confirmDeleteTitle: 'تأكيد حذف الإعلان',
    confirmDeleteDescription: 'سيتم حذف الإعلان من حسابك ولن يظهر للمستخدمين بعد ذلك. هل تريد المتابعة؟',
    confirmDeleteAction: 'حذف الإعلان',
    updateSuccess: 'تم تحديث الإعلان بنجاح.',
    promoteSuccess: 'تم ترويج الإعلان بنجاح.',
    createSuccess: 'تم نشر الإعلان بنجاح.',
    actionError: 'تعذر تنفيذ العملية. حاول مرة أخرى.',
    markSold: 'تعيين كمباع',
    unmarkSold: 'إلغاء حالة مباع',
    soldBadge: 'مباع',
    inactiveBadge: 'معطّل'
  },
  en: {
    title: 'My Listings',
    subtitle: 'Manage and promote your listings',
    normalAd: 'Normal ad',
    featuredAd: 'Featured ad',
    views: 'views',
    publishedAt: 'Published:',
    expiresIn: 'Expires in',
    days: 'days',
    noExpiry: 'No expiry date',
    view: 'View',
    edit: 'Edit',
    promote: 'Promote',
    promoteBanner: 'Promote with banner',
    delete: 'Delete',
    loading: 'Loading your listings...',
    empty: 'You do not have listings yet.',
    editTitle: 'Edit listing',
    promoteTitle: 'Promote listing',
    adTitle: 'Listing title',
    description: 'Description',
    price: 'Price',
    city: 'Governorate',
    selectCity: 'Select governorate',
    wilayah: 'Wilayah',
    selectWilayah: 'Select wilayah',
    contactPhone: 'Contact phone',
    save: 'Save changes',
    saving: 'Saving...',
    cancel: 'Cancel',
    selectPlan: 'Select promotion plan',
    duration: 'Duration',
    oneWeek: 'One week',
    twoWeeks: 'Two weeks',
    oneMonth: 'One month',
    promoteNow: 'Promote now',
    vatShort: 'VAT',
    free: 'Free',
    confirmDeleteTitle: 'Confirm listing deletion',
    confirmDeleteDescription: 'This listing will be removed from your account and will no longer be visible to users. Do you want to continue?',
    confirmDeleteAction: 'Delete listing',
    updateSuccess: 'Listing updated successfully.',
    promoteSuccess: 'Listing promoted successfully.',
    createSuccess: 'Listing published successfully.',
    actionError: 'Could not complete the action. Try again.',
    markSold: 'Mark as sold',
    unmarkSold: 'Remove sold status',
    soldBadge: 'Sold',
    inactiveBadge: 'Inactive'
  }
};

export function MyListingsPage() {
  const router = useRouter();
  const { dir, locale, localizedPath } = useI18n();
  const text = labels[locale];
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [editingListing, setEditingListing] = useState<MyListing | null>(null);
  const [promotingListing, setPromotingListing] = useState<MyListing | null>(null);
  const [pendingDeleteListing, setPendingDeleteListing] = useState<MyListing | null>(null);
  const [isDeletingListing, setIsDeletingListing] = useState(false);
  const [highlightListingId, setHighlightListingId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const authHeaders = useMemo(() => {
    const token = getUserAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, []);

  const loadListings = useCallback(
    async (options?: { refresh?: boolean; highlightAdId?: string; successMessage?: string }) => {
      const token = getUserAccessToken();
      if (!token) {
        router.replace(localizedPath('/login'));
        return;
      }

      setIsLoading(true);
      setActionError('');

      try {
        const fetchMyAds = () =>
          api.get<{ data: { items: MyListing[] } }>('/ads/my', {
            headers: { ...authHeaders, ...freshFetchHeaders },
            params: { limit: 50, ...freshFetchParams(Boolean(options?.refresh)) }
          });

        const [adsResponse, plansResponse] = await Promise.all([
          fetchMyAds(),
          api.get<{ data: PromotionPlan[] }>('/promotions/plans')
        ]);

        let items = adsResponse.data.data.items;
        const highlightId = options?.highlightAdId;
        if (highlightId && options?.refresh && !items.some((item) => item.id === highlightId)) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          items = (await fetchMyAds()).data.data.items;
        }
        if (highlightId) {
          items = [...items].sort((a, b) => {
            if (a.id === highlightId) return -1;
            if (b.id === highlightId) return 1;
            return 0;
          });
          setHighlightListingId(highlightId);
        }

        setListings(items);
        setPlans(plansResponse.data.data);
        if (options?.successMessage) {
          setActionMessage(options.successMessage);
        }
      } catch {
        setActionError(text.actionError);
      } finally {
        setIsLoading(false);
      }
    },
    [authHeaders, localizedPath, router, text.actionError]
  );

  useEffect(() => {
    hydrateFromStorage();

    const paymentReturn = consumeListingPaymentReturn();
    void loadListings({
      refresh: true,
      highlightAdId: paymentReturn?.adId,
      successMessage:
        paymentReturn?.action === 'create' ? text.createSuccess : paymentReturn ? text.promoteSuccess : undefined
    });
  }, [hydrateFromStorage, loadListings, text.createSuccess, text.promoteSuccess]);

  useEffect(() => {
    if (!highlightListingId || !highlightRef.current) return;
    highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightListingId, listings]);

  const toggleSold = async (listing: MyListing) => {
    setActionError('');
    setActionMessage('');
    try {
      if (listing.isSold) {
        await api.delete(`/ads/${listing.id}/sold`, { headers: authHeaders });
      } else {
        await api.post(`/ads/${listing.id}/sold`, undefined, { headers: authHeaders });
      }
      setListings((current) =>
        current.map((item) => (item.id === listing.id ? { ...item, isSold: !listing.isSold } : item))
      );
      setActionMessage(listing.isSold ? text.unmarkSold : text.markSold);
    } catch {
      setActionError(text.actionError);
    }
  };

  const deleteListing = async (listing: MyListing) => {
    setActionError('');
    setActionMessage('');
    setIsDeletingListing(true);

    try {
      await api.delete(`/ads/${listing.id}`, { headers: authHeaders });
      setListings((current) => current.filter((item) => item.id !== listing.id));
      setPendingDeleteListing(null);
    } catch {
      setActionError(text.actionError);
    } finally {
      setIsDeletingListing(false);
    }
  };

  const updateListing = (listing: MyListing) => {
    setListings((current) => current.map((item) => (item.id === listing.id ? { ...item, ...listing } : item)));
    setActionMessage(text.updateSuccess);
    setEditingListing(null);
  };

  const updatePromotedListing = (listingId: string, promotion: MyListing['promotion']) => {
    setListings((current) => current.map((item) => (item.id === listingId ? { ...item, promotion } : item)));
    setActionMessage(text.promoteSuccess);
    setPromotingListing(null);
  };

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="site-container site-page-main min-w-0" dir={dir}>
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{text.title}</h1>
          <p className="text-gray-600">{text.subtitle}</p>
        </div>

        {actionMessage ? <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{actionMessage}</p> : null}
        {actionError ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{actionError}</p> : null}

        {isLoading ? (
          <ListingCardsSkeleton count={4} variant="list" />
        ) : listings.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center font-bold text-gray-500 shadow-sm">{text.empty}</div>
        ) : (
          <div className="space-y-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                ref={listing.id === highlightListingId ? highlightRef : undefined}
                className={listing.id === highlightListingId ? 'rounded-2xl ring-2 ring-green-500 ring-offset-2' : undefined}
              >
                <ListingCard
                  listing={listing}
                  onDelete={() => setPendingDeleteListing(listing)}
                  onEdit={() => setEditingListing(listing)}
                  onPromote={() => setPromotingListing(listing)}
                  onToggleSold={() => toggleSold(listing)}
                  text={text}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {editingListing ? (
        <EditListingModal
          listing={editingListing}
          locale={locale}
          onClose={() => setEditingListing(null)}
          onSaved={updateListing}
          text={text}
          authHeaders={authHeaders}
        />
      ) : null}

      {promotingListing ? (
        <PromoteListingModal
          listing={promotingListing}
          plans={plans}
          onClose={() => setPromotingListing(null)}
          onSaved={updatePromotedListing}
          text={text}
          authHeaders={authHeaders}
          locale={locale}
        />
      ) : null}

      {pendingDeleteListing ? (
        <ConfirmationDialog
          title={text.confirmDeleteTitle}
          description={text.confirmDeleteDescription}
          confirmLabel={text.confirmDeleteAction}
          cancelLabel={text.cancel}
          isConfirming={isDeletingListing}
          onCancel={() => setPendingDeleteListing(null)}
          onConfirm={() => void deleteListing(pendingDeleteListing)}
          variant="danger"
        />
      ) : null}

      <SiteFooter />
    </div>
  );
}

function ListingCard({
  listing,
  onDelete,
  onEdit,
  onPromote,
  onToggleSold,
  text
}: {
  listing: MyListing;
  onDelete: () => void;
  onEdit: () => void;
  onPromote: () => void;
  onToggleSold: () => void;
  text: (typeof labels)['ar'];
}) {
  const { locale, localizedPath, m } = useI18n();
  const categoryName = (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) || listing.category?.name || '';
  const area = getListingLocationLabel(listing.city, listing.wilayah, listing.area, locale) || '-';
  const promotionLabel =
    listing.promotion?.plan?.badgeLabel ||
    (locale === 'en' ? listing.promotion?.plan?.nameEn : listing.promotion?.plan?.nameAr) ||
    text.featuredAd;
  const daysLeft = getDaysLeft(listing.expiresAt || listing.promotion?.endsAt);
  const bannerAdHref = buildBannerAdRequestUrl(localizedPath, {
    listingId: listing.id,
    title: listing.title,
    imageUrl: listing.images[0]?.imageUrl
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-6 p-6 md:flex-row">
        <div className="h-48 w-full flex-shrink-0 md:w-64">
          <ListingMediaCover
            items={listing.images}
            alt={listing.title}
            fallbackSrc={fallbackImage}
            className="h-full w-full rounded-lg"
            imageClassName="h-full w-full rounded-lg"
          />
        </div>
        <div className="flex-1">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <ListingTitleWithVerified
                title={listing.title}
                verified={listing.trustBadgeApproved}
                label={m.trustBadge.verifiedLabel}
                titleClassName="line-clamp-1 text-xl"
                className="mb-1"
              />
              <p className="mb-2 text-sm text-gray-600">
                {categoryName} {categoryName ? '•' : ''} {area}
              </p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(listing.price, listing.currency)}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {listing.isSold ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">{text.soldBadge}</span>
              ) : null}
              {!listing.isActive ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">{text.inactiveBadge}</span>
              ) : (
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${listing.promotion ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {listing.promotion ? promotionLabel : text.normalAd}
                </span>
              )}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <Meta icon={<Eye className="h-4 w-4" />} label={`${listing.views} ${text.views}`} />
            <Meta icon={<Calendar className="h-4 w-4" />} label={`${text.publishedAt} ${formatDate(listing.createdAt)}`} />
            <Meta icon={<Clock className="h-4 w-4" />} label={daysLeft === null ? text.noExpiry : `${text.expiresIn} ${daysLeft} ${text.days}`} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium transition hover:bg-gray-200" href={localizedPath(`/listing/${listing.id}`)}>
              <Eye className="h-4 w-4" />
              {text.view}
            </Link>
            <ActionButton className="bg-blue-50 text-blue-600 hover:bg-blue-100" icon={<Pen className="h-4 w-4" />} label={text.edit} onClick={onEdit} />
            <ActionButton className="bg-green-50 text-green-600 hover:bg-green-100" icon={<TrendingUp className="h-4 w-4" />} label={text.promote} onClick={onPromote} />
            <Link
              className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
              href={bannerAdHref}
            >
              <Megaphone className="h-4 w-4" />
              {text.promoteBanner}
            </Link>
            <ActionButton
              className={listing.isSold ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
              icon={<CheckCircle2 className="h-4 w-4" />}
              label={listing.isSold ? text.unmarkSold : text.markSold}
              onClick={onToggleSold}
            />
            <ActionButton className="bg-red-50 text-red-600 hover:bg-red-100" icon={<Trash2 className="h-4 w-4" />} label={text.delete} onClick={onDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditListingModal({
  authHeaders,
  listing,
  locale,
  onClose,
  onSaved,
  text
}: {
  authHeaders?: { Authorization: string };
  listing: MyListing;
  locale: 'ar' | 'en';
  onClose: () => void;
  onSaved: (listing: MyListing) => void;
  text: (typeof labels)['ar'];
}) {
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [price, setPrice] = useState(listing.price?.toString() ?? '');
  const [city, setCity] = useState(listing.city ?? '');
  const [wilayah, setWilayah] = useState(listing.wilayah ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const inputClass = 'w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500';
  const wilayahOptions = useMemo(() => (city ? getWilayahsForGovernorate(city) : []), [city]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await api.patch<{ data: MyListing }>(
        `/ads/${listing.id}`,
        {
          title,
          description,
          price: price ? Number(price) : undefined,
          city: city || undefined,
          wilayah: wilayah || undefined
        },
        { headers: authHeaders }
      );
      onSaved({ ...listing, ...response.data.data, category: listing.category, promotion: listing.promotion });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={text.editTitle}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={text.adTitle}><input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} required /></Field>
        <Field label={text.description}><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${inputClass} min-h-28`} required /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={text.price}><input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" className={inputClass} /></Field>
          <Field label={text.city}>
            <select
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setWilayah('');
              }}
              className={inputClass}
            >
              <option value="">{text.selectCity}</option>
              {omanGovernorates.map((governorate) => (
                <option key={governorate.value} value={governorate.value}>
                  {locale === 'en' ? governorate.en : governorate.ar}
                </option>
              ))}
            </select>
          </Field>
          <Field label={text.wilayah}>
            <select
              value={wilayah}
              onChange={(event) => setWilayah(event.target.value)}
              disabled={!city}
              className={inputClass}
            >
              <option value="">{text.selectWilayah}</option>
              {wilayahOptions.map((wilayahOption) => (
                <option key={wilayahOption.value} value={wilayahOption.value}>
                  {locale === 'en' ? wilayahOption.en : wilayahOption.ar}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-5 py-2 font-bold transition hover:bg-gray-50">{text.cancel}</button>
          <button type="submit" disabled={isSaving} className="rounded-xl bg-green-600 px-5 py-2 font-bold text-white transition hover:bg-green-700 disabled:opacity-70">
            {isSaving ? text.saving : text.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PromoteListingModal({
  authHeaders,
  listing,
  locale,
  onClose,
  onSaved,
  plans,
  text
}: {
  authHeaders?: { Authorization: string };
  listing: MyListing;
  locale: 'ar' | 'en';
  onClose: () => void;
  onSaved: (listingId: string, promotion: MyListing['promotion']) => void;
  plans: PromotionPlan[];
  text: (typeof labels)['ar'];
}) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');
  const [days, setDays] = useState(7);
  const [isSaving, setIsSaving] = useState(false);
  const selectedPlan = plans.find((plan) => plan.id === planId);
  const selectedPrice = selectedPlan ? getPlanPrice(selectedPlan, days) : 0;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!planId) return;
    setIsSaving(true);
    try {
      const response = await api.post<{
        data: {
          promotion?: NonNullable<MyListing['promotion']>;
          checkout?: { paymentUrl?: string; sessionId?: string; paid?: boolean };
        };
      }>(
        '/promotions/ad-promotions',
        { adId: listing.id, planId, days },
        { headers: authHeaders, params: { locale } }
      );

      const paymentUrl = response.data.data.checkout?.paymentUrl;
      const sessionId = response.data.data.checkout?.sessionId;
      if (paymentUrl) {
        if (sessionId) storePendingThawaniSession(sessionId);
        window.location.href = paymentUrl;
        return;
      }

      if (response.data.data.promotion) {
        onSaved(listing.id, response.data.data.promotion);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={text.promoteTitle}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="mb-2 block font-bold text-gray-700">{text.selectPlan}</label>
          <div className="grid gap-3">
            {plans.map((plan) => {
              const active = plan.id === planId;
              const planBasePrice = getPlanPrice(plan, days);
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setPlanId(plan.id)}
                  className={`rounded-2xl border p-4 text-start transition ${active ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-black">{locale === 'en' ? plan.nameEn : plan.nameAr}</span>
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: plan.color || '#16a34a' }} />
                  </div>
                  <p className="text-sm text-gray-500">{locale === 'en' ? plan.descriptionEn : plan.descriptionAr}</p>
                  <div className="mt-2">
                    <PlanPriceWithVat
                      basePrice={planBasePrice}
                      locale={locale}
                      freeLabel={text.free}
                      vatShort={text.vatShort}
                      mainClassName="text-lg font-black text-green-600"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <Field label={text.duration}>
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500">
            <option value={7}>{text.oneWeek}</option>
            <option value={14}>{text.twoWeeks}</option>
            <option value={30}>{text.oneMonth}</option>
          </select>
        </Field>
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
          <p className="text-sm text-gray-500">{listing.title}</p>
          <div className="mt-1">
            <PlanPriceWithVat
              basePrice={selectedPrice}
              locale={locale}
              freeLabel={text.free}
              vatShort={text.vatShort}
              mainClassName="text-2xl font-black text-green-600"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-5 py-2 font-bold transition hover:bg-gray-50">{text.cancel}</button>
          <button type="submit" disabled={isSaving || !planId} className="rounded-xl bg-green-600 px-5 py-2 font-bold text-white transition hover:bg-green-700 disabled:opacity-70">
            {isSaving ? text.saving : text.promoteNow}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 transition hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Meta({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ActionButton({ className, icon, label, onClick }: { className: string; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${className}`}>
      {icon}
      {label}
    </button>
  );
}

function formatPrice(price: string | number | null | undefined, currency: string) {
  if (price === null || price === undefined || price === '') return '-';
  return `${Number(price).toLocaleString()} ${currency === 'OMR' ? 'ر.ع' : currency}`;
}

function formatDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function getDaysLeft(value?: string | null) {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function getPlanPrice(plan: PromotionPlan, days: number) {
  if (days === 7) return Number(plan.weekPrice);
  if (days === 14) return Number(plan.twoWeeksPrice);
  return Number(plan.monthPrice);
}
