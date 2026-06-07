'use client';

import { Phone, Store } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { SiteFooter } from '@/components/home/site-footer';
import { FilterChipsSkeleton, StoreCardsSkeleton } from '@/components/stores/store-card-skeleton';
import { UserSiteHeader, SiteHeaderSearch } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getCityLabel, omanCities } from '@/lib/oman-cities';

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

  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [total, setTotal] = useState(0);
  const query = (searchParams.get('q') ?? '').trim();
  const [storeTypeId, setStoreTypeId] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStoreTypes, setIsLoadingStoreTypes] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const typeFromUrl = searchParams.get('storeTypeId') ?? '';
    const cityFromUrl = searchParams.get('city') ?? '';
    setStoreTypeId(typeFromUrl);
    setCity(cityFromUrl);
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
  }, [page, query, storeTypeId, city, text.loadError]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    setPage(1);
  }, [query, storeTypeId, city]);

  const hasMore = stores.length < total;

  const showStoreSkeleton = isLoading && page === 1;

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
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

        <div className="mb-4">
          {isLoadingStoreTypes ? (
            <FilterChipsSkeleton count={7} />
          ) : (
            <div className="filter-chips-scroll flex gap-2 overflow-x-auto pb-2">
              <FilterChip active={!storeTypeId} onClick={() => setStoreTypeId('')}>
                {text.allStoreTypes}
              </FilterChip>
              {storeTypes.map((storeType) => (
                <FilterChip
                  key={storeType.id}
                  active={storeTypeId === storeType.id}
                  onClick={() => setStoreTypeId(storeTypeId === storeType.id ? '' : storeType.id)}
                >
                  {locale === 'en' ? storeType.nameEn : storeType.nameAr}
                </FilterChip>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="filter-chips-scroll flex gap-2 overflow-x-auto pb-2">
            <FilterChip active={!city} onClick={() => setCity('')}>
              {text.allCities}
            </FilterChip>
            {omanCities.map((cityOption) => (
              <FilterChip
                key={cityOption.value}
                active={city === cityOption.value}
                onClick={() => setCity(city === cityOption.value ? '' : cityOption.value)}
              >
                {locale === 'en' ? cityOption.en : cityOption.ar}
              </FilterChip>
            ))}
          </div>
        </div>

        {error ? <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

        {showStoreSkeleton ? (
          <StoreCardsSkeleton count={8} />
        ) : stores.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-16 text-center text-gray-500">{text.empty}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} locale={locale} localizedPath={localizedPath} text={text} />
            ))}
          </div>
        )}

        {hasMore ? (
          <div className="mt-8 text-center">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
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
  const cityLabel = getCityLabel(store.city, locale);

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

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
        active ? 'bg-green-600 text-white' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}