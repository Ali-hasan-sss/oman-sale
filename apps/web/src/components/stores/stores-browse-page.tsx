'use client';

import { ChevronDown, Phone, Store } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { SiteFooter } from '@/components/home/site-footer';
import { FilterChipsSkeleton, StoreCardsSkeleton } from '@/components/stores/store-card-skeleton';
import { UserSiteHeader, SiteHeaderSearch } from '@/components/navigation/user-site-header';
import { useSiteHeaderOffset } from '@/hooks/use-site-header-offset';
import { api } from '@/lib/api';
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
  rootCategory?: { id: string; nameAr: string; nameEn: string; slug: string };
  storeType?: StoreType | null;
};

type StoresResponse = {
  items: PublicStore[];
  total: number;
  page: number;
  limit: number;
};

const fallbackImage = '/logo.png';

export function StoresBrowsePage() {
  const { dir, locale, localizedPath, m } = useI18n();
  const searchParams = useSearchParams();
  const text = m.storesBrowse;
  const headerOffset = useSiteHeaderOffset();

  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [total, setTotal] = useState(0);
  const query = (searchParams.get('q') ?? '').trim();
  const [storeTypeId, setStoreTypeId] = useState('');
  const [city, setCity] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStoreTypes, setIsLoadingStoreTypes] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const typeFromUrl = searchParams.get('storeTypeId') ?? '';
    const cityFromUrl = searchParams.get('city') ?? '';
    const wilayahFromUrl = searchParams.get('wilayah') ?? '';
    setStoreTypeId(typeFromUrl);
    setCity(cityFromUrl);
    setWilayah(wilayahFromUrl);
  }, [searchParams]);

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
          q: query.trim() || undefined,
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
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    setPage(1);
  }, [query, storeTypeId, city, wilayah]);

  const wilayahOptions = city ? getWilayahsForGovernorate(city) : [];
  const hasMore = stores.length < total;
  const showStoreSkeleton = isLoading && page === 1;

  const resetFilters = () => {
    setStoreTypeId('');
    setCity('');
    setWilayah('');
    setPage(1);
  };

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-black text-gray-900">{text.title}</h1>
          <p className="text-gray-600">{text.subtitle}</p>
          <p className="mt-2 text-sm font-bold text-gray-500">
            {total.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')} {text.results}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow-sm lg:sticky" style={{ top: headerOffset || 16 }}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold">{text.filters}</h2>
                <button type="button" onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
                  {text.clearAll}
                </button>
              </div>

              <div
                className="filter-sidebar-scrollbar space-y-6 overflow-y-auto"
                style={{ maxHeight: headerOffset ? `calc(100vh - ${headerOffset}px - 1rem)` : 'calc(100vh - 12rem)' }}
              >
                {isLoadingStoreTypes ? (
                  <FilterChipsSkeleton count={6} />
                ) : (
                  <FilterSection title={text.storeTypeFilter}>
                    <SidebarFilterChip active={!storeTypeId} onClick={() => setStoreTypeId('')}>
                      {text.allStoreTypes}
                    </SidebarFilterChip>
                    {storeTypes.map((storeType) => (
                      <SidebarFilterChip
                        key={storeType.id}
                        active={storeTypeId === storeType.id}
                        onClick={() => setStoreTypeId(storeTypeId === storeType.id ? '' : storeType.id)}
                      >
                        {locale === 'en' ? storeType.nameEn : storeType.nameAr}
                      </SidebarFilterChip>
                    ))}
                  </FilterSection>
                )}

                <FilterSection title={text.governorateFilter}>
                  <SidebarFilterChip
                    active={!city}
                    onClick={() => {
                      setCity('');
                      setWilayah('');
                    }}
                  >
                    {text.allCities}
                  </SidebarFilterChip>
                  {omanGovernorates.map((governorate) => (
                    <SidebarFilterChip
                      key={governorate.value}
                      active={city === governorate.value}
                      onClick={() => {
                        if (city === governorate.value) {
                          setCity('');
                          setWilayah('');
                        } else {
                          setCity(governorate.value);
                          setWilayah('');
                        }
                      }}
                    >
                      {locale === 'en' ? governorate.en : governorate.ar}
                    </SidebarFilterChip>
                  ))}
                </FilterSection>

                {city && wilayahOptions.length > 0 ? (
                  <FilterSection title={text.allWilayahs}>
                    <SidebarFilterChip active={!wilayah} onClick={() => setWilayah('')}>
                      {text.allWilayahsInGovernorate}
                    </SidebarFilterChip>
                    {wilayahOptions.map((wilayahOption) => (
                      <SidebarFilterChip
                        key={wilayahOption.value}
                        active={wilayah === wilayahOption.value}
                        onClick={() => setWilayah(wilayah === wilayahOption.value ? '' : wilayahOption.value)}
                      >
                        {locale === 'en' ? wilayahOption.en : wilayahOption.ar}
                      </SidebarFilterChip>
                    ))}
                  </FilterSection>
                ) : null}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold transition hover:bg-gray-50"
                  >
                    {text.resetFilters}
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-3">
            {error ? <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

            {showStoreSkeleton ? (
              <StoreCardsSkeleton count={8} />
            ) : stores.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-16 text-center text-gray-500">
                {text.empty}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                  <StoreCard key={store.id} store={store} locale={locale} localizedPath={localizedPath} text={text} />
                ))}
              </div>
            )}

            {hasMore ? (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg bg-gray-100 px-8 py-3 font-bold transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? text.loading : text.loadMore}
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function StoreCard({
  store,
  locale,
  localizedPath,
  text
}: {
  store: PublicStore;
  locale: 'ar' | 'en';
  localizedPath: (href: string) => string;
  text: (typeof import('@/lib/locales/en.json'))['storesBrowse'];
}) {
  const name = locale === 'en' ? store.nameEn : store.nameAr;
  const bio = locale === 'en' ? store.bioEn : store.bioAr;
  const typeName = locale === 'en' ? store.storeType?.nameEn : store.storeType?.nameAr;
  const cityLabel = getStoreLocationLabel(store.city, store.wilayah, locale);

  return (
    <Link
      href={localizedPath(`/stores/${store.slug}`)}
      className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <img
          src={store.coverUrl || fallbackImage}
          alt={name}
          className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${store.coverUrl ? 'object-cover' : 'object-contain p-8'}`}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 start-3 flex items-center gap-2">
          <img
            src={store.logoUrl || fallbackImage}
            alt=""
            className="h-11 w-11 rounded-xl border-2 border-white bg-white object-cover shadow"
          />
        </div>
      </div>
      <div className="p-4">
        <h2 className="mb-1 line-clamp-1 text-lg font-black text-gray-900">{name}</h2>
        {typeName ? (
          <span className="mb-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
            {typeName}
          </span>
        ) : null}
        {bio ? <p className="mb-3 line-clamp-2 text-sm text-gray-600">{bio}</p> : null}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1 font-bold">
            <Store size={14} />
            {store.listingsCount} {text.listings}
          </span>
          {cityLabel ? <span className="font-bold text-gray-600">{cityLabel}</span> : null}
          {store.phone ? (
            <span className="inline-flex items-center gap-1" dir="ltr">
              <Phone size={14} />
              {store.phone}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function FilterSection({ children, title }: { children: ReactNode; title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        className="mb-3 flex w-full items-center justify-between"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <h3 className="text-sm font-bold">{title}</h3>
        <ChevronDown size={18} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

function SidebarFilterChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? 'border-blue-600 bg-blue-50 text-blue-700'
          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500'
      }`}
    >
      {children}
    </button>
  );
}
