'use client';

import { Globe, MapPin, Phone, Store } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { FavoriteButton } from '@/components/listings/favorite-button';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

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
  owner?: { id: string; fullName: string; avatar?: string | null } | null;
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
  promotion?: { plan?: { badgeLabel?: string | null } | null } | null;
};

type ListingsResponse = {
  items: StoreListing[];
  total: number;
  page: number;
  limit: number;
};

const fallbackImage = '/logo.png';

export function StorePublicPage({ slug }: { slug: string }) {
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
  const text = m.storePublic;

  const [store, setStore] = useState<PublicStore | null>(null);
  const [listings, setListings] = useState<StoreListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [error, setError] = useState('');

  const loadStore = useCallback(async () => {
    setIsLoadingStore(true);
    setError('');
    try {
      const response = await api.get<{ data: PublicStore }>(`/stores/slug/${slug}`);
      setStore(response.data.data);
    } catch {
      setStore(null);
      setError(text.notFound);
    } finally {
      setIsLoadingStore(false);
    }
  }, [slug, text.notFound]);

  const loadListings = useCallback(async () => {
    setIsLoadingListings(true);
    try {
      const response = await api.get<{ data: ListingsResponse }>(`/stores/slug/${slug}/ads`, {
        params: { page, limit: 12 }
      });
      setListings((current) => (page === 1 ? response.data.data.items : [...current, ...response.data.data.items]));
      setTotal(response.data.data.total);
    } catch {
      if (page === 1) setListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  }, [page, slug]);

  useEffect(() => {
    setPage(1);
    setListings([]);
  }, [slug]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  useEffect(() => {
    if (!store) return;
    loadListings();
  }, [loadListings, store]);

  const storeName = store ? (locale === 'en' ? store.nameEn : store.nameAr) : '';
  const storeBio = store ? (locale === 'en' ? store.bioEn : store.bioAr) : '';
  const categoryName = store
    ? locale === 'en'
      ? store.rootCategory?.nameEn
      : store.rootCategory?.nameAr
    : '';
  const hasMore = listings.length < total;

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href={localizedPath('/')} className="flex items-center gap-3">
              <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
            </Link>
            <MobileNavMenu />
            <div className="hidden items-center gap-4 lg:flex">
              <button type="button" onClick={toggleLocale} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                <Globe size={18} />
                <span className="text-sm">{m.common.languageSwitch}</span>
              </button>
              <ChatNavLink className="rounded-lg border border-gray-300 px-4 py-2" />
              <Link href={localizedPath('/stores')} className="rounded-lg border border-gray-300 px-4 py-2">
                {m.storesBrowse.title}
              </Link>
              <HeaderAuthAction loginClassName="rounded-lg border border-gray-300 px-4 py-2" />
            </div>
          </div>
        </div>
      </header>

      {isLoadingStore ? (
        <div className="py-24 text-center font-bold text-gray-500">{text.loading}</div>
      ) : !store ? (
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="mb-6 text-gray-600">{error || text.notFound}</p>
          <Link href={localizedPath('/stores')} className="inline-flex rounded-xl bg-green-600 px-6 py-3 font-bold text-white">
            {text.backToStores}
          </Link>
        </div>
      ) : (
        <>
          <section className="relative h-56 bg-slate-200 md:h-72">
            <img
              src={store.coverUrl || fallbackImage}
              alt={storeName}
              className={`h-full w-full ${store.coverUrl ? 'object-cover' : 'object-contain p-12'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </section>

          <main className="mx-auto max-w-7xl px-4 pb-12">
            <div className="relative -mt-16 mb-8 rounded-3xl bg-white p-6 shadow-lg md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end">
                <img
                  src={store.logoUrl || fallbackImage}
                  alt={storeName}
                  className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-lg md:h-28 md:w-28"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={localizedPath('/stores')}
                    className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-green-700 hover:underline"
                  >
                    {text.backToStores}
                  </Link>
                  <h1 className="text-3xl font-black text-gray-900">{storeName}</h1>
                  {categoryName ? <p className="mt-1 text-sm font-bold text-green-700">{categoryName}</p> : null}
                  {storeBio ? <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-relaxed text-gray-600">{storeBio}</p> : null}
                  <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-700">
                    {store.phone ? (
                      <a href={`tel:${store.phone}`} className="inline-flex items-center gap-2 font-bold" dir="ltr">
                        <Phone size={18} className="text-green-600" />
                        {store.phone}
                      </a>
                    ) : null}
                    <span className="inline-flex items-center gap-2 font-bold text-gray-600">
                      <Store size={18} className="text-green-600" />
                      {store.listingsCount} {text.listings}
                    </span>
                  </div>
                  {store.owner ? (
                    <div className="mt-4 flex items-center gap-3">
                      {store.owner.avatar ? (
                        <img src={store.owner.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600">
                          {store.owner.fullName.slice(0, 1)}
                        </div>
                      )}
                      <span className="text-sm text-gray-600">
                        {text.owner}: <span className="font-bold text-gray-900">{store.owner.fullName}</span>
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-gray-900">{text.storeListings}</h2>
                <p className="text-sm font-bold text-gray-500">
                  {total.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')} {text.results}
                </p>
              </div>

              {isLoadingListings && listings.length === 0 ? (
                <p className="py-12 text-center font-bold text-gray-500">{text.loading}</p>
              ) : listings.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-gray-500">{text.noListings}</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} locale={locale} localizedPath={localizedPath} featuredLabel={m.common.featured} />
                  ))}
                </div>
              )}

              {hasMore ? (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    disabled={isLoadingListings}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white disabled:opacity-60"
                  >
                    {isLoadingListings ? text.loading : text.loadMore}
                  </button>
                </div>
              ) : null}
            </section>
          </main>
        </>
      )}

      <SiteFooter />
    </div>
  );
}

function ListingCard({
  listing,
  locale,
  localizedPath,
  featuredLabel
}: {
  listing: StoreListing;
  locale: 'ar' | 'en';
  localizedPath: (href: string) => string;
  featuredLabel: string;
}) {
  const image = listing.images?.[0]?.imageUrl;
  const categoryName =
    (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) ?? listing.category?.name ?? '';

  return (
    <Link
      href={localizedPath(`/listing/${listing.id}`)}
      className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={image ?? fallbackImage}
          alt={listing.title}
          className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${image ? 'object-cover' : 'object-contain p-8'}`}
        />
        <FavoriteButton
          adId={listing.id}
          className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition hover:bg-white"
        />
        {listing.promotion ? (
          <span className="absolute start-3 top-3 rounded-md bg-green-500 px-3 py-1 text-xs font-bold text-white">
            {listing.promotion.plan?.badgeLabel ?? featuredLabel}
          </span>
        ) : null}
        {categoryName ? (
          <span className="absolute bottom-3 end-3 rounded-md bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
            {categoryName}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="mb-2 line-clamp-1 font-bold text-gray-900">{listing.title}</h3>
        <p className="mb-3 text-xl font-black text-green-600">{formatPrice(listing.price, listing.currency)}</p>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={16} className="text-gray-400" />
          <span>{listing.area || listing.city || '-'}</span>
        </div>
      </div>
    </Link>
  );
}

function formatPrice(price: string | number | null | undefined, currency: string) {
  if (price == null || price === '') return '-';
  const value = Number(price);
  if (Number.isNaN(value)) return `${price} ${currency}`;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${currency}`;
}
