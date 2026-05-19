'use client';

import { ArrowLeft, Calendar, Eye, Mail, Phone, Tag, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type AdminUserAd = {
  id: string;
  title: string;
  description: string;
  type: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  area?: string | null;
  status: string;
  isApproved: boolean;
  isActive: boolean;
  isSold: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    name?: string;
    nameAr?: string;
    nameEn?: string;
  } | null;
  images?: Array<{ imageUrl: string }>;
  promotion?: {
    endsAt: string;
    isActive: boolean;
    deletedAt?: string | null;
    plan?: {
      badgeLabel?: string | null;
      nameAr?: string | null;
      nameEn?: string | null;
      color?: string | null;
    } | null;
  } | null;
};

type AdminUserDetailsData = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  bio?: string | null;
  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    ads: number;
    favorites: number;
    payments: number;
    reports: number;
  };
};

type AdminUserAdsResponse = {
  items: AdminUserAd[];
  total: number;
  page: number;
  limit: number;
};

const fallbackImage = '/logo.png';
const ADS_PAGE_SIZE = 20;

export function AdminUserDetails({ userId }: { userId: string }) {
  const { locale, localizedPath, m } = useI18n();
  const [user, setUser] = useState<AdminUserDetailsData | null>(null);
  const [ads, setAds] = useState<AdminUserAd[]>([]);
  const [adsPage, setAdsPage] = useState(1);
  const [adsTotal, setAdsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(false);
  const [error, setError] = useState('');
  const dateLocale = locale === 'ar' ? 'ar-OM' : 'en-US';

  const loadAdsPage = async (page: number, append = false) => {
    setAdsLoading(true);
    try {
      const response = await adminApi().get<{ data: AdminUserAdsResponse }>('/admin/ads', {
        params: { userId, page, limit: ADS_PAGE_SIZE }
      });
      setAds((current) => (append ? [...current, ...response.data.data.items] : response.data.data.items));
      setAdsPage(response.data.data.page);
      setAdsTotal(response.data.data.total);
    } finally {
      setAdsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      setLoading(true);
      setError('');
      try {
        const [userResponse, adsResponse] = await Promise.all([
          adminApi().get<{ data: AdminUserDetailsData }>(`/admin/users/${userId}`),
          adminApi().get<{ data: AdminUserAdsResponse }>('/admin/ads', {
            params: { userId, page: 1, limit: ADS_PAGE_SIZE }
          })
        ]);
        if (!cancelled) {
          setUser(userResponse.data.data);
          setAds(adsResponse.data.data.items);
          setAdsPage(adsResponse.data.data.page);
          setAdsTotal(adsResponse.data.data.total);
        }
      } catch {
        if (!cancelled) setError(m.admin.userDetailsLoadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [m.admin.userDetailsLoadError, userId]);

  if (loading) {
    return <div className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">{m.admin.loadingUsers}</div>;
  }

  if (error || !user) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 font-bold text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={localizedPath('/admin/users')}
            className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-700"
          >
            <ArrowLeft size={16} />
            {m.admin.backToUsers}
          </Link>
          <h2 className="text-3xl font-black text-slate-900">{m.admin.userDetails}</h2>
        </div>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-brand-50 text-brand-700">
              {user.avatar ? <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover" /> : <UserRound size={34} />}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">{user.fullName}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <RoleBadge role={user.role} labels={m.admin} />
                <StateBadge active={user.isActive} label={user.isActive ? m.admin.active : m.admin.inactive} />
                <StateBadge active={!user.isBlocked} label={user.isBlocked ? m.admin.blocked : m.admin.notBlocked} />
                <StateBadge active={user.isVerified} label={user.isVerified ? m.admin.verified : m.admin.notVerified} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={m.admin.ads} value={user._count.ads} />
            <Stat label={m.admin.payments} value={user._count.payments} />
            <Stat label={m.admin.reports} value={user._count.reports} />
            <Stat label={m.admin.favorites} value={user._count.favorites} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard title={m.admin.personalInfo}>
          <InfoRow icon={<UserRound size={18} />} label={m.admin.fullName} value={user.fullName} />
          <InfoRow icon={<Mail size={18} />} label={m.admin.email} value={user.email} />
          <InfoRow icon={<Phone size={18} />} label={m.admin.phone} value={user.phone || '-'} />
          <InfoRow icon={<Tag size={18} />} label={m.admin.bio} value={user.bio || '-'} />
        </InfoCard>

        <InfoCard title={m.admin.accountInfo}>
          <InfoRow icon={<Calendar size={18} />} label={m.admin.joinedAt} value={formatDate(user.createdAt, dateLocale)} />
          <InfoRow icon={<Calendar size={18} />} label={m.admin.updatedAt} value={formatDate(user.updatedAt, dateLocale)} />
          <InfoRow icon={<Eye size={18} />} label={m.admin.lastSeen} value={user.lastSeenAt ? formatDate(user.lastSeenAt, dateLocale) : '-'} />
          <InfoRow icon={<Tag size={18} />} label={m.admin.role} value={roleLabel(user.role, m.admin)} />
        </InfoCard>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-black text-slate-900">{m.admin.userAds}</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
            {adsTotal.toLocaleString(dateLocale)}
          </span>
        </div>

        {ads.length === 0 && adsLoading ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">{m.admin.loadingUserAds}</p>
        ) : ads.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">{m.admin.noUserAds}</p>
        ) : (
          <>
            <div className="grid gap-4">
              {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} locale={locale} labels={m.admin} dateLocale={dateLocale} />
              ))}
            </div>
            {ads.length < adsTotal ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadAdsPage(adsPage + 1, true)}
                  disabled={adsLoading}
                  className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {adsLoading ? m.admin.loadingUserAds : m.admin.loadMoreAds}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function InfoCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-black text-slate-900">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="mt-0.5 font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
      <p className="text-2xl font-black text-slate-900">{value.toLocaleString()}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function AdCard({
  ad,
  dateLocale,
  labels,
  locale
}: {
  ad: AdminUserAd;
  dateLocale: string;
  labels: ReturnType<typeof useI18n>['m']['admin'];
  locale: 'ar' | 'en';
}) {
  const categoryName = locale === 'en' ? ad.category?.nameEn || ad.category?.name : ad.category?.nameAr || ad.category?.name;
  const promotion = ad.promotion?.isActive && !ad.promotion.deletedAt ? ad.promotion : null;
  const image = ad.images?.[0]?.imageUrl;
  const promotionLabel =
    promotion?.plan?.badgeLabel || (locale === 'en' ? promotion?.plan?.nameEn : promotion?.plan?.nameAr) || labels.featuredAd;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row">
      <div className="h-32 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 md:w-44">
        <img src={image || fallbackImage} alt={ad.title} className={`h-full w-full ${image ? 'object-cover' : 'object-contain p-8'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="font-black text-slate-900">{ad.title}</h4>
            <p className="mt-1 text-sm text-slate-500">
              {categoryName || ad.type} {ad.city ? `• ${ad.city}` : ''}
            </p>
          </div>
          <p className="font-black text-brand-700">{formatPrice(ad.price, ad.currency)}</p>
        </div>
        <p className="line-clamp-2 text-sm text-slate-600">{ad.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StateBadge active={ad.isActive} label={ad.isActive ? labels.active : labels.inactive} />
          <StateBadge active={ad.isApproved} label={ad.isApproved ? labels.approved : labels.notApproved} />
          {ad.isSold ? <StateBadge active={false} label={labels.sold} /> : null}
          {promotion ? (
            <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: promotion.plan?.color || '#16a34a' }}>
              {promotionLabel}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
          <span>{labels.views}: {ad.views.toLocaleString(dateLocale)}</span>
          <span>{labels.joinedAt}: {formatDate(ad.createdAt, dateLocale)}</span>
        </div>
      </div>
    </article>
  );
}

function RoleBadge({ role, labels }: { role: AdminUserDetailsData['role']; labels: ReturnType<typeof useI18n>['m']['admin'] }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{roleLabel(role, labels)}</span>;
}

function StateBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'}`}>
      {label}
    </span>
  );
}

function roleLabel(role: AdminUserDetailsData['role'], labels: ReturnType<typeof useI18n>['m']['admin']) {
  return role === 'ADMIN' ? labels.admin : role === 'MODERATOR' ? labels.moderator : labels.user;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatPrice(price: string | number | null | undefined, currency: string) {
  if (price === null || price === undefined || price === '') return '-';
  return `${Number(price).toLocaleString()} ${currency === 'OMR' ? 'ر.ع' : currency}`;
}
