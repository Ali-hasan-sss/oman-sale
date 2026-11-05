'use client';

import { ChevronLeft, ChevronRight, MapPin, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { AdBannerSlot } from '@/components/home/hero-banners-section';
import { SiteFooter } from '@/components/home/site-footer';
import { FilterChipsSkeleton, StoreCardsSkeleton } from '@/components/stores/store-card-skeleton';
import { VerifiedBadge } from '@/components/trust-badge/verified-badge';
import { UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { CategoryIcon } from '@/lib/category-icons';
import { useI18n } from '@/lib/i18n';
import { getStoreLocationLabel, getWilayahsForGovernorate, omanGovernorates } from '@/lib/oman-locations';

type StoreType = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string | null;
};

type PublicStore = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  bioAr: string;
  bioEn: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  city?: string | null;
  wilayah?: string | null;
  listingsCount: number;
  trustBadgeApproved?: boolean;
  rootCategory?: { id: string; nameAr: string; nameEn: string; slug: string };
  storeType?: StoreType | null;
};

type StoresResponse = {
  items: PublicStore[];
  total: number;
  page: number;
  limit: number;
};

/* Warm "souq" palette used by this page. */
const INK = 'rgb(var(--oman-ink-900))';
const BROWN = 'rgb(var(--oman-green-700))';

/* Faint geometric (8-point star / circle) pattern for the hero band. */
/* Faint Islamic 8-point star (two overlapping squares) pattern for the hero band. */
const heroPattern =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23168c4e' stroke-opacity='.10' stroke-width='1.2'%3E%3Crect x='21' y='21' width='22' height='22'/%3E%3Crect x='21' y='21' width='22' height='22' transform='rotate(45 32 32)'/%3E%3Ccircle cx='32' cy='32' r='6'/%3E%3C/g%3E%3C/svg%3E\")";

export function StoresBrowsePage() {
  const { dir, locale, localizedPath, m } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const text = m.storesBrowse;
  const isAr = locale !== 'en';

  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [total, setTotal] = useState(0);
  const query = (searchParams.get('q') ?? '').trim();
  const [searchValue, setSearchValue] = useState(query);
  const [storeTypeId, setStoreTypeId] = useState('');
  const [city, setCity] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStoreTypes, setIsLoadingStoreTypes] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setStoreTypeId(searchParams.get('storeTypeId') ?? '');
    setCity(searchParams.get('city') ?? '');
    setWilayah(searchParams.get('wilayah') ?? '');
    setSearchValue((searchParams.get('q') ?? '').trim());
  }, [searchParams]);

  // Search box -> ?q= (debounced), so results stay shareable and the back button works.
  useEffect(() => {
    const term = searchValue.trim();
    if (term === query) return undefined;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) params.set('q', term);
      else params.delete('q');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchValue, query, searchParams, router, pathname]);

  useEffect(() => {
    setIsLoadingStoreTypes(true);
    api
      .get<{ data: StoreType[] }>('/store-types')
      .then((response) => setStoreTypes(response.data.data))
      .catch(() => setStoreTypes([]))
      .finally(() => setIsLoadingStoreTypes(false));
  }, [locale]);

  const loadStores = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<{ data: StoresResponse }>('/stores', {
        params: {
          q: query || undefined,
          storeTypeId: storeTypeId || undefined,
          city: city || undefined,
          wilayah: city && wilayah ? wilayah : undefined,
          page,
          limit: 12
        }
      });
      setStores((current) => (page === 1 ? response.data.data.items : [...current, ...response.data.data.items]));
      setTotal(response.data.data.total);
    } catch {
      setError(text.loadError);
      if (page === 1) setStores([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, query, storeTypeId, city, wilayah, text.loadError]);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    setPage(1);
  }, [query, storeTypeId, city, wilayah]);

  const wilayahOptions = city ? getWilayahsForGovernorate(city) : [];
  const hasMore = stores.length < total;
  const showStoreSkeleton = isLoading && page === 1;

  const copy = isAr
    ? {
        home: 'الرئيسية',
        subtitle: 'معارض ومكاتب ومتاجر موثّقة تعرض إعلاناتها في سلطنة عُمان.',
        allStores: 'كل المتاجر',
        addStore: 'أضف متجرك',
        countSuffix: 'متجر في عُمان',
        viewListings: 'عرض إعلانات المتجر'
      }
    : {
        home: 'Home',
        subtitle: 'Verified showrooms, offices and shops listing across Oman.',
        allStores: 'All stores',
        addStore: 'Add your store',
        countSuffix: 'stores in Oman',
        viewListings: "View store's listings"
      };

  return (
    <div className="site-page-shell bg-slate-50" dir={dir}>
      <UserSiteHeader />

      {/* Hero band */}
      <section
        className="relative overflow-hidden border-b border-slate-200"
        style={{
          backgroundColor: '#ffffff',
          backgroundImage: `radial-gradient(55% 90% at 18% 50%, rgba(75,187,120,.12), rgba(75,187,120,0) 70%), radial-gradient(40% 70% at 95% 0%, rgba(243,43,43,.06), rgba(243,43,43,0) 70%), ${heroPattern}`
        }}
      >
        <div className="site-container relative flex items-center gap-8 py-8 sm:py-10 lg:py-12">
          <div className="min-w-0 flex-1">
            <nav className="mb-3 flex items-center gap-1.5 text-sm" aria-label="breadcrumb">
              <Link href={localizedPath('/')} className="font-bold" style={{ color: BROWN }}>
                {copy.home}
              </Link>
              {isAr ? <ChevronLeft size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
              <span className="text-slate-500">{text.title}</span>
            </nav>

            <h1 className="text-4xl font-black sm:text-5xl" style={{ color: INK }}>
              {text.title}
            </h1>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">{copy.subtitle}</p>

            <div className="mt-6">
              {isLoadingStoreTypes ? (
                <FilterChipsSkeleton count={6} />
              ) : (
                <div className="filter-chips-scroll -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
                  <TypeChip active={!storeTypeId} onClick={() => setStoreTypeId('')} icon="🛍️">
                    {copy.allStores}
                  </TypeChip>
                  {storeTypes.map((storeType) => (
                    <TypeChip
                      key={storeType.id}
                      active={storeTypeId === storeType.id}
                      onClick={() => setStoreTypeId(storeTypeId === storeType.id ? '' : storeType.id)}
                      icon={storeType.icon}
                    >
                      {isAr ? storeType.nameAr : storeType.nameEn}
                    </TypeChip>
                  ))}
                </div>
              )}
            </div>

            <Link
              href={localizedPath('/stores/create')}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-base font-black text-white shadow-[0_14px_28px_-14px_rgba(22,140,78,0.9)] transition hover:-translate-y-0.5 hover:bg-brand-700"
            >
              <Plus size={20} strokeWidth={2.6} />
              {copy.addStore}
            </Link>
          </div>

          <div className="relative hidden shrink-0 md:block" aria-hidden>
            <div className="flex h-56 w-56 items-center justify-center rounded-full border border-dashed border-brand-300 bg-[radial-gradient(circle,rgba(221,245,230,.9),rgba(221,245,230,0)_70%)] lg:h-64 lg:w-64">
              <span className="select-none text-[120px] leading-none [filter:drop-shadow(0_22px_18px_rgba(15,23,42,0.22))] lg:text-[140px]">
                🏬
              </span>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-[linear-gradient(90deg,rgb(var(--oman-brick-500))_0_33.3%,#ffffff_33.3%_66.6%,rgb(var(--oman-green-500))_66.6%_100%)]" aria-hidden />
      </section>

      <main className="site-container site-page-main min-w-0">
        {/* Toolbar: count + location filters + search */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-lg text-slate-600">
            <span className="font-black" style={{ color: INK }}>
              {total.toLocaleString('en-US')}
            </span>{' '}
            {copy.countSuffix}
          </p>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <select
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setWilayah('');
              }}
              aria-label={text.governorateFilter}
              className="h-12 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-ink-900 outline-none focus:border-brand-500"
            >
              <option value="">{text.allCities}</option>
              {omanGovernorates.map((governorate) => (
                <option key={governorate.value} value={governorate.value}>
                  {isAr ? governorate.ar : governorate.en}
                </option>
              ))}
            </select>

            {city && wilayahOptions.length > 0 ? (
              <select
                value={wilayah}
                onChange={(event) => setWilayah(event.target.value)}
                aria-label={text.allWilayahs}
                className="h-12 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-ink-900 outline-none focus:border-brand-500"
              >
                <option value="">{text.allWilayahsInGovernorate}</option>
                {wilayahOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isAr ? option.ar : option.en}
                  </option>
                ))}
              </select>
            ) : null}

            <label className="relative block sm:w-80">
              <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={isAr ? 'ابحث عن متجر...' : 'Search for a store...'}
                className="h-12 w-full rounded-full border border-slate-200 bg-white pe-4 ps-11 text-sm text-ink-900 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </label>
          </div>
        </div>

        <AdBannerSlot placement="STORES" variant="inline" />

        {error ? <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

        {showStoreSkeleton ? (
          <StoreCardsSkeleton count={8} />
        ) : stores.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center text-slate-500">
            {text.empty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                isAr={isAr}
                localizedPath={localizedPath}
                viewListings={copy.viewListings}
                verifiedLabel={m.trustBadge.verifiedLabel}
                locale={isAr ? 'ar' : 'en'}
              />
            ))}
          </div>
        )}

        {hasMore ? (
          <div className="mt-12 text-center">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-full border border-slate-200 bg-white px-8 py-3 font-black text-ink-900 transition hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? text.loading : text.loadMore}
            </button>
          </div>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}

function TypeChip({
  active,
  onClick,
  icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon?: string | null;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-black transition ${
        active
          ? 'border-transparent bg-brand-600 text-white shadow-[0_8px_18px_-10px_rgba(22,140,78,0.9)]'
          : 'border-slate-200 bg-white text-ink-900 hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      {icon ? <CategoryIcon icon={icon} size={20} strokeWidth={1.8} /> : null}
      {children}
    </button>
  );
}

function StoreCard({
  store,
  isAr,
  locale,
  localizedPath,
  viewListings,
  verifiedLabel
}: {
  store: PublicStore;
  isAr: boolean;
  locale: 'ar' | 'en';
  localizedPath: (href: string) => string;
  viewListings: string;
  verifiedLabel: string;
}) {
  const name = isAr ? store.nameAr : store.nameEn;
  const typeName = isAr ? store.storeType?.nameAr : store.storeType?.nameEn;
  const cityLabel = getStoreLocationLabel(store.city, store.wilayah, locale);
  // "معرض الأصيل" -> "أ": skip a generic first word and the article "ال".
  const words = (name || '').trim().split(/\s+/);
  const keyWord = ((words.length > 1 ? words[1] : words[0]) ?? '').replace(/^ال(?=\S{2,})/, '');
  const initial = keyWord.charAt(0).replace('ا', 'أ');

  return (
    <Link
      href={localizedPath(`/stores/${store.slug}`)}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_22px_40px_-24px_rgba(15,23,42,0.45)]"
    >
      <div className="relative h-32 sm:h-36">
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900">
          {store.coverUrl ? (
            <img
              src={store.coverUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl [filter:drop-shadow(0_10px_10px_rgba(0,0,0,0.35))]">
                {store.storeType?.icon ? <CategoryIcon icon={store.storeType.icon} size={64} /> : '🏬'}
              </span>
            </div>
          )}
        </div>

        <div className="absolute -bottom-7 end-auto start-5">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-[3px] border-white bg-brand-700 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.6)]">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-black text-white">
                {initial}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-4 pt-10">
        <h2 className="flex items-start gap-1.5 text-lg font-black leading-snug text-ink-900">
          <span className="line-clamp-2">{name}</span>
          {store.trustBadgeApproved ? <VerifiedBadge title={verifiedLabel} className="mt-1.5" /> : null}
        </h2>
        {typeName ? <p className="mt-1 text-sm font-bold text-brick-500">{typeName}</p> : null}
        {cityLabel ? (
          <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-500">
            <MapPin size={14} className="shrink-0" />
            {cityLabel}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3.5 text-sm font-black text-brand-700">
          <span>
            {viewListings}
            {store.listingsCount ? <span className="ms-1.5 font-bold text-slate-400">({store.listingsCount})</span> : null}
          </span>
          {isAr ? (
            <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          ) : (
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
          )}
        </div>
      </div>
    </Link>
  );
}
