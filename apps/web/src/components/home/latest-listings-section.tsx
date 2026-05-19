'use client';

import { ArrowUpLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { FavoriteButton } from '@/components/listings/favorite-button';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';

type Listing = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  area?: string | null;
  category?: {
    name?: string;
    nameAr?: string;
    nameEn?: string;
  };
  images?: Array<{ imageUrl: string }>;
  promotion?: {
    plan?: {
      badgeLabel?: string | null;
    };
  } | null;
};

type ListingsResponse = {
  items: Listing[];
};

const placeholderImage = '/logo.png';

export function LatestListingsSection() {
  const { locale, localizedPath, m } = useI18n();
  const [listings, setListings] = useState<Listing[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .get<{ data: ListingsResponse }>('/ads/latest', { params: { limit: 8 } })
      .then((response) => setListings(response.data.data.items))
      .catch(() => setListings([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const token = getUserAccessToken();
    if (!token || listings.length === 0) return;

    api
      .get<{ data: string[] }>('/ads/favorites/ids', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setFavoriteIds(new Set(response.data.data)))
      .catch(() => setFavoriteIds(new Set()));
  }, [listings.length]);

  const visibleListings = useMemo(() => listings.slice(0, 8), [listings]);
  const loadingText = locale === 'ar' ? 'جاري تحميل الإعلانات...' : 'Loading listings...';
  const emptyText = locale === 'ar' ? 'لا توجد إعلانات متاحة حاليًا' : 'No listings are available right now';

  return (
    <section className="mb-14">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-black">{m.home.latestListings}</h2>
        <Link href={localizedPath('/all-listings')} className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">
          {m.common.viewAll}
          <ArrowUpLeft size={16} />
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-white p-8 text-center font-bold text-slate-500 shadow-sm">
          {loadingText}
        </div>
      ) : visibleListings.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center font-bold text-slate-500 shadow-sm">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {visibleListings.map((listing) => {
            const category =
              (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) ?? listing.category?.name ?? '';
            const image = listing.images?.[0]?.imageUrl;
            const isFeatured = Boolean(listing.promotion);

            return (
              <Link
                key={listing.id}
                href={localizedPath(`/listing/${listing.id}`)}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={image ?? placeholderImage}
                    alt={listing.title}
                    className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${image ? 'object-cover' : 'object-contain p-8'}`}
                  />
                  <FavoriteButton
                    adId={listing.id}
                    initialFavorited={favoriteIds.has(listing.id)}
                    onChange={(favorited) => {
                      setFavoriteIds((current) => {
                        const next = new Set(current);
                        if (favorited) next.add(listing.id);
                        else next.delete(listing.id);
                        return next;
                      });
                    }}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition hover:scale-110 hover:bg-white"
                  />
                  {isFeatured ? (
                    <span className="absolute left-3 top-3 rounded-md bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                      {listing.promotion?.plan?.badgeLabel ?? m.common.featured}
                    </span>
                  ) : null}
                  {category ? (
                    <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                      {category}
                    </span>
                  ) : null}
                </div>

                <div className="p-4">
                  <h3 className="mb-2 truncate text-base font-bold text-ink-900">{listing.title}</h3>
                  <p className="mb-3 text-xl font-black text-brand-600">{formatPrice(listing.price, listing.currency)}</p>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{listing.area || listing.city || '-'}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatPrice(price: string | number | null | undefined, currency: string) {
  if (price === null || price === undefined) return '';
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return String(price);
  return `${numericPrice.toLocaleString('en-US')} ${currency === 'OMR' ? 'ر.ع' : currency}`;
}
