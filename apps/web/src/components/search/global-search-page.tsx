'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { SiteFooter } from '@/components/home/site-footer';
import { ListingCardsSkeleton } from '@/components/listings/listing-card-skeleton';
import { ListingMediaCover } from '@/components/listings/listing-media-cover';
import { ListingStoreChip } from '@/components/listings/listing-store-chip';
import { ListingTitleWithVerified } from '@/components/trust-badge/listing-verified-badge';
import { VerifiedBadge } from '@/components/trust-badge/verified-badge';
import { UserSiteHeader, SiteHeaderSearch } from '@/components/navigation/user-site-header';
import { StoreCardsSkeleton } from '@/components/stores/store-card-skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getCityLabel } from '@/lib/oman-cities';
import { getListingLocationLabel } from '@/lib/oman-locations';
import { resolveMediaUrl } from '@/lib/media-url';

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

type Listing = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  wilayah?: string | null;
  area?: string | null;
  images?: Array<{ imageUrl: string }>;
  store?: {
    nameAr: string;
    nameEn: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
  trustBadgeApproved?: boolean;
};

type Store = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  bioAr: string;
  bioEn: string;
  coverUrl?: string | null;
  city?: string | null;
  listingsCount: number;
  trustBadgeApproved?: boolean;
};

type Article = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImageUrl: string;
};

type TourismDestination = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  imageUrl: string;
};

const fallbackImage = '/logo.png';

export function GlobalSearchPage() {
  const { dir, locale, localizedPath, m } = useI18n();
  const text = m.globalSearch;
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();

  const [listings, setListings] = useState<Listing[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [tourism, setTourism] = useState<TourismDestination[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const matchedCategories = useMemo(() => {
    if (!query) return [];
    const term = query.toLowerCase();
    return categories.filter((category) => category.name.toLowerCase().includes(term) || category.slug.toLowerCase().includes(term));
  }, [categories, query]);

  useEffect(() => {
    api
      .get<{ data: Category[] }>('/categories', { params: { locale } })
      .then((response) => setCategories(response.data.data))
      .catch(() => setCategories([]));
  }, [locale]);

  useEffect(() => {
    if (!query) {
      setListings([]);
      setStores([]);
      setArticles([]);
      setTourism([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([
      api.get<{ data: { items: Listing[]; total: number } }>('/ads/all', {
        params: { q: query, page: 1, limit: 8 }
      }),
      api.get<{ data: { items: Store[]; total: number } }>('/stores', {
        params: { q: query, page: 1, limit: 8 }
      }),
      api.get<{ data: { items: Article[]; total: number } }>('/articles', {
        params: { q: query, page: 1, limit: 8 }
      }),
      api.get<{ data: TourismDestination[] }>('/tourism/destinations')
    ])
      .then(([listingsResponse, storesResponse, articlesResponse, tourismResponse]) => {
        setListings(listingsResponse.data.data.items);
        setStores(storesResponse.data.data.items);
        setArticles(articlesResponse.data.data.items);
        const term = query.toLowerCase();
        setTourism(
          tourismResponse.data.data.filter((destination) => {
            const title = locale === 'en' ? destination.titleEn : destination.titleAr;
            return (
              title.toLowerCase().includes(term) ||
              destination.slug.toLowerCase().includes(term) ||
              destination.titleAr.toLowerCase().includes(term) ||
              destination.titleEn.toLowerCase().includes(term)
            );
          }).slice(0, 8)
        );
      })
      .catch(() => {
        setListings([]);
        setStores([]);
        setArticles([]);
        setTourism([]);
      })
      .finally(() => setIsLoading(false));
  }, [query, locale]);

  const hasResults =
    matchedCategories.length > 0 || listings.length > 0 || stores.length > 0 || articles.length > 0 || tourism.length > 0;

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="site-container site-page-main min-w-0">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-black text-gray-900">{text.title}</h1>
          {query ? (
            <p className="text-gray-600">
              {text.queryLabel}: <span className="font-bold text-gray-900">&quot;{query}&quot;</span>
            </p>
          ) : (
            <p className="text-gray-600">{text.hint}</p>
          )}
        </div>

        {!query ? null : isLoading ? (
          <div className="space-y-10">
            <section>
              <div className="mb-4 h-7 w-32 animate-pulse rounded-full bg-slate-200" />
              <ListingCardsSkeleton count={4} />
            </section>
            <section>
              <div className="mb-4 h-7 w-32 animate-pulse rounded-full bg-slate-200" />
              <StoreCardsSkeleton count={4} />
            </section>
          </div>
        ) : !hasResults ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-16 text-center text-gray-500">{text.empty}</p>
        ) : (
          <div className="space-y-10">
            {matchedCategories.length > 0 ? (
              <section>
                <h2 className="mb-4 text-xl font-black text-gray-900">{text.categories}</h2>
                <div className="flex flex-wrap gap-2">
                  {matchedCategories.slice(0, 12).map((category) => (
                    <Link
                      key={category.id}
                      href={localizedPath(`/category/${category.slug}`)}
                      className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-800 transition hover:bg-green-100"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {listings.length > 0 ? (
              <section>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-gray-900">{text.listings}</h2>
                  <Link href={localizedPath(`/all-listings?q=${encodeURIComponent(query)}`)} className="text-sm font-bold text-green-700 hover:underline">
                    {text.viewAll}
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {listings.map((listing) => {
                    const storeName = listing.store
                      ? locale === 'en'
                        ? listing.store.nameEn
                        : listing.store.nameAr
                      : null;
                    return (
                      <Link
                        key={listing.id}
                        href={localizedPath(`/listing/${listing.id}`)}
                        className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
                      >
                        <div className="relative">
                          <ListingMediaCover
                            items={listing.images}
                            alt={listing.title}
                            fallbackSrc={fallbackImage}
                            className="h-44 w-full"
                            imageClassName="h-44 w-full"
                          />
                        </div>
                        <div className="p-4">
                          <ListingTitleWithVerified
                            title={listing.title}
                            verified={listing.trustBadgeApproved}
                            label={m.trustBadge.verifiedLabel}
                            titleClassName="line-clamp-1 text-sm"
                            className="mb-2"
                          />
                          {storeName && listing.store ? (
                            <div className="mb-2">
                              <ListingStoreChip
                                name={storeName}
                                slug={listing.store.slug}
                                logoUrl={listing.store.logoUrl}
                                storeHref={localizedPath(`/stores/${listing.store.slug}`)}
                              />
                            </div>
                          ) : null}
                          <p className="font-bold text-green-600">
                            {listing.price ? `${listing.price} ${listing.currency}` : '-'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">{getListingLocationLabel(listing.city, listing.wilayah, listing.area, locale) || '-'}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {articles.length > 0 ? (
              <section>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-gray-900">{text.articles}</h2>
                  <Link href={localizedPath(`/news?q=${encodeURIComponent(query)}`)} className="text-sm font-bold text-green-700 hover:underline">
                    {text.viewAll}
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {articles.map((article) => {
                    const title = locale === 'en' ? article.titleEn : article.titleAr;
                    return (
                      <Link
                        key={article.id}
                        href={localizedPath(`/news/${article.slug}`)}
                        className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
                      >
                        <img src={resolveMediaUrl(article.coverImageUrl)} alt={title} className="h-44 w-full object-cover" />
                        <div className="p-4">
                          <h3 className="line-clamp-2 font-bold text-gray-900">{title}</h3>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {tourism.length > 0 ? (
              <section>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-gray-900">{text.tourism}</h2>
                  <Link href={localizedPath(`/tourism?q=${encodeURIComponent(query)}`)} className="text-sm font-bold text-green-700 hover:underline">
                    {text.viewAll}
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {tourism.map((destination) => {
                    const title = locale === 'en' ? destination.titleEn : destination.titleAr;
                    return (
                      <Link
                        key={destination.id}
                        href={localizedPath(`/destination/${destination.slug}`)}
                        className="group relative block h-44 overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
                      >
                        <img
                          src={resolveMediaUrl(destination.imageUrl)}
                          alt={title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <h3 className="absolute inset-x-0 bottom-0 p-4 font-bold text-white">{title}</h3>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {stores.length > 0 ? (
              <section>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-gray-900">{text.stores}</h2>
                  <Link href={localizedPath(`/stores?q=${encodeURIComponent(query)}`)} className="text-sm font-bold text-green-700 hover:underline">
                    {text.viewAll}
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {stores.map((store) => {
                    const name = locale === 'en' ? store.nameEn : store.nameAr;
                    const bio = locale === 'en' ? store.bioEn : store.bioAr;
                    return (
                      <Link
                        key={store.id}
                        href={localizedPath(`/stores/${store.slug}`)}
                        className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                      >
                        <img
                          src={store.coverUrl ?? fallbackImage}
                          alt={name}
                          className={`h-36 w-full ${store.coverUrl ? 'object-cover' : 'object-contain bg-slate-100 p-6'}`}
                        />
                        <div className="p-4">
                          <h3 className="mb-1 flex items-center gap-1.5 font-black text-gray-900">
                            {name}
                            {store.trustBadgeApproved ? <VerifiedBadge title={m.trustBadge.verifiedLabel} /> : null}
                          </h3>
                          <p className="line-clamp-2 text-sm text-gray-500">{bio}</p>
                          <p className="mt-2 text-xs font-bold text-gray-400">
                            {getCityLabel(store.city, locale)} · {store.listingsCount} {m.storesBrowse.listings}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
