'use client';

import { MapPin, Phone, Store, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { SiteFooter } from '@/components/home/site-footer';
import { UserSiteHeader } from '@/components/navigation/user-site-header';
import { FavoriteButton } from '@/components/listings/favorite-button';
import { ListingCardsSkeleton } from '@/components/listings/listing-card-skeleton';
import { ListingMediaCover } from '@/components/listings/listing-media-cover';
import { StorePublicPageSkeleton } from '@/components/stores/store-public-page-skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getListingLocationLabel, getStoreLocationLabel } from '@/lib/oman-locations';

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
  storeType?: { id: string; nameAr: string; nameEn: string; slug: string; icon?: string | null } | null;
  owner?: { id: string; fullName: string; avatar?: string | null } | null;
};

type StoreListing = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  wilayah?: string | null;
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
  const { dir, locale, localizedPath, m } = useI18n();
  const text = m.storePublic;

  const [store, setStore] = useState<PublicStore | null>(null);
  const [listings, setListings] = useState<StoreListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [error, setError] = useState('');
  const [lightboxImage, setLightboxImage] = useState<'cover' | 'logo' | null>(null);

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
  const typeName = store
    ? locale === 'en'
      ? store.storeType?.nameEn
      : store.storeType?.nameAr
    : '';
  const cityLabel = store ? getStoreLocationLabel(store.city, store.wilayah, locale) : '';
  const hasMore = listings.length < total;

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <UserSiteHeader />

      {isLoadingStore ? (
        <StorePublicPageSkeleton />
      ) : !store ? (
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="mb-6 text-gray-600">{error || text.notFound}</p>
          <Link href={localizedPath('/stores')} className="inline-flex rounded-xl bg-green-600 px-6 py-3 font-bold text-white">
            {text.backToStores}
          </Link>
        </div>
      ) : (
        <>
          <section className="relative h-52 overflow-hidden bg-slate-200 md:h-72">
            {store.coverUrl ? (
              <button
                type="button"
                onClick={() => setLightboxImage('cover')}
                className="block h-full w-full cursor-zoom-in"
                aria-label={storeName}
              >
                <img src={store.coverUrl} alt={storeName} className="h-full w-full object-cover" />
              </button>
            ) : (
              <img src={fallbackImage} alt={storeName} className="h-full w-full object-contain p-12" />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-50 to-transparent" />
          </section>

          <section className="bg-gray-50 pb-8">
            <div className="mx-auto max-w-7xl px-4">
              <div className="relative z-10 -mt-14 md:-mt-[4.5rem]">
                <div className="rounded-3xl border border-white/50 bg-white/55 p-6 shadow-xl backdrop-blur-md md:p-8">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    {store.logoUrl ? (
                      <button
                        type="button"
                        onClick={() => setLightboxImage('logo')}
                        className="-mt-16 h-24 w-24 shrink-0 cursor-zoom-in self-start rounded-2xl border-4 border-white/80 bg-white/70 shadow-lg backdrop-blur-sm md:-mt-20 md:h-28 md:w-28"
                        aria-label={storeName}
                      >
                        <img src={store.logoUrl} alt={storeName} className="h-full w-full rounded-[0.65rem] object-cover" />
                      </button>
                    ) : (
                      <img
                        src={fallbackImage}
                        alt={storeName}
                        className="-mt-16 h-24 w-24 shrink-0 self-start rounded-2xl border-4 border-white/80 bg-white/70 object-contain p-3 shadow-lg backdrop-blur-sm md:-mt-20 md:h-28 md:w-28"
                      />
                    )}
                    <div className="min-w-0 flex-1 md:pt-2">
                      <Link
                        href={localizedPath('/stores')}
                        className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-green-700 hover:underline"
                      >
                        {text.backToStores}
                      </Link>
                      <h1 className="text-3xl font-black text-gray-900">{storeName}</h1>
                      {typeName ? (
                        <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                          {typeName}
                        </span>
                      ) : null}
                      {storeBio ? <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-relaxed text-gray-600">{storeBio}</p> : null}
                      <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-700">
                        {cityLabel ? (
                          <span className="inline-flex items-center gap-2 font-bold">
                            <MapPin size={18} className="text-green-600" />
                            {cityLabel}
                          </span>
                        ) : null}
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
              </div>
            </div>
          </section>

          <main className="mx-auto max-w-7xl px-4 pb-12">
            <section className="mb-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-gray-900">{text.storeListings}</h2>
                <p className="text-sm font-bold text-gray-500">
                  {total.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')} {text.results}
                </p>
              </div>

              {isLoadingListings && listings.length === 0 ? (
                <ListingCardsSkeleton count={8} />
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

          {lightboxImage === 'cover' && store.coverUrl ? (
            <StoreImageLightbox src={store.coverUrl} alt={storeName} dir={dir} onClose={() => setLightboxImage(null)} />
          ) : null}
          {lightboxImage === 'logo' && store.logoUrl ? (
            <StoreImageLightbox src={store.logoUrl} alt={storeName} dir={dir} onClose={() => setLightboxImage(null)} />
          ) : null}
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
  const categoryName =
    (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) ?? listing.category?.name ?? '';

  return (
    <Link
      href={localizedPath(`/listing/${listing.id}`)}
      className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-52 overflow-hidden">
        <ListingMediaCover
          items={listing.images}
          alt={listing.title}
          fallbackSrc={fallbackImage}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          imageClassName="h-full w-full"
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
          <span>{getListingLocationLabel(listing.city, listing.wilayah, listing.area, locale) || '-'}</span>
        </div>
      </div>
    </Link>
  );
}

function StoreImageLightbox({
  src,
  alt,
  dir,
  onClose
}: {
  src: string;
  alt: string;
  dir: 'rtl' | 'ltr';
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 p-4 pt-[max(1rem,env(safe-area-inset-top))]"
      dir={dir}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute end-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
        aria-label="Close"
      >
        <X size={24} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-full object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body
  );
}

function formatPrice(price: string | number | null | undefined, currency: string) {
  if (price == null || price === '') return '-';
  const value = Number(price);
  if (Number.isNaN(value)) return `${price} ${currency}`;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${currency}`;
}
