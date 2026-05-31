'use client';

import { Globe, Phone, Search, Store } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { api } from '@/lib/api';
import { buildCategoryTree } from '@/lib/category-tree';
import { useI18n } from '@/lib/i18n';

type RootCategory = {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  parentId?: string | null;
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
  listingsCount: number;
  rootCategory?: { id: string; nameAr: string; nameEn: string; slug: string };
};

type StoresResponse = {
  items: PublicStore[];
  total: number;
  page: number;
  limit: number;
};

const fallbackImage = '/logo.png';

export function StoresBrowsePage() {
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
  const text = m.storesBrowse;

  const [categories, setCategories] = useState<RootCategory[]>([]);
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rootCategoryId, setRootCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const rootCategories = useMemo(() => buildCategoryTree(categories), [categories]);

  useEffect(() => {
    api
      .get<{ data: RootCategory[] }>('/categories', { params: { locale, includeInactive: false } })
      .then((response) => setCategories(response.data.data))
      .catch(() => setCategories([]));
  }, [locale]);

  const loadStores = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<{ data: StoresResponse }>('/stores', {
        params: {
          q: query.trim() || undefined,
          rootCategoryId: rootCategoryId || undefined,
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
  }, [page, query, rootCategoryId, text.loadError]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    setPage(1);
  }, [query, rootCategoryId]);

  const hasMore = stores.length < total;

  const submitSearch = () => {
    setQuery(searchInput.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link href={localizedPath('/')} className="flex items-center gap-3">
              <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
            </Link>
            <MobileNavMenu />
            <div className="hidden items-center gap-4 lg:flex">
              <button
                type="button"
                onClick={toggleLocale}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition hover:bg-gray-50"
              >
                <Globe size={18} />
                <span className="text-sm">{m.common.languageSwitch}</span>
              </button>
              <ChatNavLink className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
              <HeaderLink href="/stores" label={text.title} />
              <HeaderLink href="/all-listings" label={m.common.allListings} />
              <Link href={localizedPath('/add-listing')} className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700">
                {m.common.addListing}
              </Link>
              <HeaderAuthAction loginClassName="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
            </div>
          </div>
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitSearch();
              }}
              type="search"
              placeholder={text.searchPlaceholder}
              className={`w-full rounded-lg border border-gray-300 py-3 outline-none focus:ring-2 focus:ring-green-500 ${dir === 'rtl' ? 'pl-4 pr-12' : 'pl-12 pr-4'}`}
            />
            <button
              type="button"
              onClick={submitSearch}
              className={`absolute top-1/2 -translate-y-1/2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold text-white ${dir === 'rtl' ? 'left-2' : 'right-2'}`}
            >
              {text.search}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-black text-gray-900">{text.title}</h1>
          <p className="text-gray-600">{text.subtitle}</p>
          <p className="mt-2 text-sm font-bold text-gray-500">
            {total.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')} {text.results}
          </p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <FilterChip active={!rootCategoryId} onClick={() => setRootCategoryId('')}>
            {text.allCategories}
          </FilterChip>
          {rootCategories.map((category) => (
            <FilterChip
              key={category.id}
              active={rootCategoryId === category.id}
              onClick={() => setRootCategoryId(rootCategoryId === category.id ? '' : category.id)}
            >
              {locale === 'en' ? category.nameEn || category.name : category.nameAr || category.name}
            </FilterChip>
          ))}
        </div>

        {error ? <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

        {isLoading && stores.length === 0 ? (
          <p className="py-16 text-center font-bold text-gray-500">{text.loading}</p>
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
  const categoryName =
    locale === 'en' ? store.rootCategory?.nameEn : store.rootCategory?.nameAr;

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
        {categoryName ? <p className="mb-2 text-xs font-bold text-green-700">{categoryName}</p> : null}
        {bio ? <p className="mb-3 line-clamp-2 text-sm text-gray-600">{bio}</p> : null}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1 font-bold">
            <Store size={14} />
            {store.listingsCount} {text.listings}
          </span>
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
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
        active ? 'bg-green-600 text-white' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function HeaderLink({ href, label }: { href: string; label: string }) {
  const { localizedPath } = useI18n();
  return (
    <Link href={localizedPath(href)} className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50">
      {label}
    </Link>
  );
}
