'use client';

import { Calendar, CheckCircle2, Clock, Eye, Globe, Pen, Search, Trash2, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';
import { useAuthStore } from '@/store/auth-store';
import { ListingCardsSkeleton } from './listing-card-skeleton';

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

const omanCities = [
  { value: 'مسقط', ar: 'مسقط', en: 'Muscat' },
  { value: 'صلالة', ar: 'صلالة', en: 'Salalah' },
  { value: 'صحار', ar: 'صحار', en: 'Sohar' },
  { value: 'نزوى', ar: 'نزوى', en: 'Nizwa' },
  { value: 'صور', ar: 'صور', en: 'Sur' },
  { value: 'البريمي', ar: 'البريمي', en: 'Al Buraimi' },
  { value: 'الرستاق', ar: 'الرستاق', en: 'Rustaq' },
  { value: 'السيب', ar: 'السيب', en: 'Seeb' },
  { value: 'الخوير', ar: 'الخوير', en: 'Al Khuwair' },
  { value: 'القرم', ar: 'القرم', en: 'Qurum' }
] as const;

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
    delete: 'حذف',
    loading: 'جاري تحميل إعلاناتك...',
    empty: 'لا توجد إعلانات خاصة بك حاليًا.',
    editTitle: 'تعديل الإعلان',
    promoteTitle: 'ترقية الإعلان',
    adTitle: 'عنوان الإعلان',
    description: 'الوصف',
    price: 'السعر',
    city: 'المدينة',
    selectCity: 'اختر المدينة',
    area: 'المنطقة',
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
    confirmDeleteTitle: 'تأكيد حذف الإعلان',
    confirmDeleteDescription: 'سيتم حذف الإعلان من حسابك ولن يظهر للمستخدمين بعد ذلك. هل تريد المتابعة؟',
    confirmDeleteAction: 'حذف الإعلان',
    updateSuccess: 'تم تحديث الإعلان بنجاح.',
    promoteSuccess: 'تم ترويج الإعلان بنجاح.',
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
    delete: 'Delete',
    loading: 'Loading your listings...',
    empty: 'You do not have listings yet.',
    editTitle: 'Edit listing',
    promoteTitle: 'Promote listing',
    adTitle: 'Listing title',
    description: 'Description',
    price: 'Price',
    city: 'City',
    selectCity: 'Select city',
    area: 'Area',
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
    confirmDeleteTitle: 'Confirm listing deletion',
    confirmDeleteDescription: 'This listing will be removed from your account and will no longer be visible to users. Do you want to continue?',
    confirmDeleteAction: 'Delete listing',
    updateSuccess: 'Listing updated successfully.',
    promoteSuccess: 'Listing promoted successfully.',
    actionError: 'Could not complete the action. Try again.',
    markSold: 'Mark as sold',
    unmarkSold: 'Remove sold status',
    soldBadge: 'Sold',
    inactiveBadge: 'Inactive'
  }
};

export function MyListingsPage() {
  const router = useRouter();
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
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

  const authHeaders = useMemo(() => {
    const token = getUserAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, []);

  useEffect(() => {
    hydrateFromStorage();
    const token = getUserAccessToken();
    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    Promise.all([
      api.get<{ data: { items: MyListing[] } }>('/ads/my?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
      api.get<{ data: PromotionPlan[] }>('/promotions/plans')
    ])
      .then(([adsResponse, plansResponse]) => {
        setListings(adsResponse.data.data.items);
        setPlans(plansResponse.data.data);
      })
      .catch(() => {
        setActionError(text.actionError);
      })
      .finally(() => setIsLoading(false));
  }, []);

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
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link className="flex items-center gap-3" href={localizedPath('/')}>
              <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
            </Link>
            <MobileNavMenu />
            <div className="hidden items-center gap-4 lg:flex">
              <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition hover:bg-gray-50" onClick={toggleLocale} type="button">
                <Globe size={18} />
                <span className="text-sm">{m.common.languageSwitch}</span>
              </button>
              <ChatNavLink className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
              <HeaderLink href="/all-listings" label={m.common.allListings} />
              <HeaderLink href="/my-listings" label={m.common.myListings} />
              <Link className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700" href={localizedPath('/add-listing')}>
                {m.common.addListing}
              </Link>
              <HeaderAuthAction loginClassName="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
            </div>
          </div>
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
            <input
              type="text"
              placeholder={m.home.searchPlaceholder}
              className={`w-full rounded-lg border border-gray-300 py-3 outline-none focus:ring-2 focus:ring-green-500 ${dir === 'rtl' ? 'pl-4 pr-12' : 'pl-12 pr-4'}`}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8" dir={dir}>
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
              <ListingCard
                key={listing.id}
                listing={listing}
                onDelete={() => setPendingDeleteListing(listing)}
                onEdit={() => setEditingListing(listing)}
                onPromote={() => setPromotingListing(listing)}
                onToggleSold={() => toggleSold(listing)}
                text={text}
              />
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

  function HeaderLink({ href, label }: { href: string; label: string }) {
    return (
      <Link className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" href={localizedPath(href)}>
        {label}
      </Link>
    );
  }
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
  const { locale, localizedPath } = useI18n();
  const categoryName = (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) || listing.category?.name || '';
  const area = listing.area || listing.city || '-';
  const image = listing.images[0]?.imageUrl;
  const promotionLabel =
    listing.promotion?.plan?.badgeLabel ||
    (locale === 'en' ? listing.promotion?.plan?.nameEn : listing.promotion?.plan?.nameAr) ||
    text.featuredAd;
  const daysLeft = getDaysLeft(listing.expiresAt || listing.promotion?.endsAt);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-6 p-6 md:flex-row">
        <div className="h-48 w-full flex-shrink-0 md:w-64">
          <img
            src={image || fallbackImage}
            alt={listing.title}
            className={`h-full w-full rounded-lg ${image ? 'object-cover' : 'object-contain p-8'}`}
          />
        </div>
        <div className="flex-1">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="mb-1 text-xl font-bold">{listing.title}</h3>
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
  const [isSaving, setIsSaving] = useState(false);
  const inputClass = 'w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500';
  const hasCustomCity = city && !omanCities.some((cityOption) => cityOption.value === city);

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
          city: city || undefined
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
            <select value={city} onChange={(event) => setCity(event.target.value)} className={inputClass}>
              <option value="">{text.selectCity}</option>
              {hasCustomCity ? <option value={city}>{city}</option> : null}
              {omanCities.map((cityOption) => (
                <option key={cityOption.value} value={cityOption.value}>
                  {locale === 'en' ? cityOption.en : cityOption.ar}
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
      const response = await api.post<{ data: NonNullable<MyListing['promotion']> }>(
        '/promotions/ad-promotions',
        { adId: listing.id, planId, days },
        { headers: authHeaders }
      );
      onSaved(listing.id, response.data.data);
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
          <p className="mt-1 text-2xl font-black text-green-600">{formatPrice(selectedPrice, 'OMR')}</p>
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
