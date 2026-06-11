'use client';

import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getListingLocationLabel } from '@/lib/oman-locations';
import { getUserAccessToken } from '@/lib/user-auth';
import { useAuthStore } from '@/store/auth-store';
import { ArticleSaveButton } from '@/components/articles/article-save-button';
import { resolveMediaUrl } from '@/lib/media-url';

import { FavoriteButton } from './favorite-button';
import { ListingMediaCover } from './listing-media-cover';

type FavoriteListing = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  wilayah?: string | null;
  area?: string | null;
  images?: Array<{ imageUrl: string }>;
  category?: {
    name?: string;
    nameAr?: string;
    nameEn?: string;
  } | null;
  promotion?: {
    plan?: {
      badgeLabel?: string | null;
    } | null;
  } | null;
};

const fallbackImage = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop';

const labels = {
  ar: {
    title: 'المفضلة',
    subtitle: 'كل الإعلانات التي حفظتها في مكان واحد',
    loading: 'جاري تحميل المفضلة...',
    empty: 'لا توجد إعلانات في المفضلة حاليًا.',
    featured: 'مميز'
  },
  en: {
    title: 'Favorites',
    subtitle: 'All listings you saved in one place',
    loading: 'Loading favorites...',
    empty: 'No favorite listings yet.',
    featured: 'Featured'
  }
};

type SavedArticle = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImageUrl: string;
  category?: { nameAr: string; nameEn: string };
};

export function FavoritesPage() {
  const router = useRouter();
  const { dir, locale, localizedPath, m } = useI18n();
  const text = labels[locale];
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const [listings, setListings] = useState<FavoriteListing[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    hydrateFromStorage();
    const token = getUserAccessToken();
    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      api.get<{ data: FavoriteListing[] }>('/ads/favorites', { headers }),
      api.get<{ data: SavedArticle[] }>('/articles/saves', { headers })
    ])
      .then(([listingsRes, articlesRes]) => {
        setListings(listingsRes.data.data);
        setSavedArticles(articlesRes.data.data);
      })
      .catch(() => {
        setListings([]);
        setSavedArticles([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{text.title}</h1>
          <p className="text-gray-600">{text.subtitle}</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-white p-8 text-center font-bold text-gray-500 shadow-sm">{text.loading}</div>
        ) : listings.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center font-bold text-gray-500 shadow-sm">{text.empty}</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => (
              <FavoriteCard
                key={listing.id}
                listing={listing}
                onRemoved={() => setListings((current) => current.filter((item) => item.id !== listing.id))}
                text={text}
              />
            ))}
          </div>
        )}

        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">{m.articles.savedArticlesTitle}</h2>
          {isLoading ? null : savedArticles.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">{m.articles.savedArticlesEmpty}</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {savedArticles.map((article) => {
                const title = locale === 'en' ? article.titleEn : article.titleAr;
                const category = locale === 'en' ? article.category?.nameEn : article.category?.nameAr;
                return (
                  <Link
                    key={article.id}
                    href={localizedPath(`/news/${article.slug}`)}
                    className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-lg"
                  >
                    <div className="relative h-48">
                      <img src={resolveMediaUrl(article.coverImageUrl)} alt={title} className="h-full w-full object-cover transition group-hover:scale-105" />
                      <div className="absolute end-3 top-3">
                        <ArticleSaveButton
                          articleId={article.id}
                          initialSaved
                          onChange={(saved) => {
                            if (!saved) setSavedArticles((current) => current.filter((item) => item.id !== article.id));
                          }}
                          showLabel={false}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90"
                        />
                      </div>
                      {category ? <span className="absolute bottom-3 start-3 rounded-md bg-black/60 px-3 py-1 text-xs text-white">{category}</span> : null}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 font-bold text-slate-900">{title}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );

}

function FavoriteCard({ listing, onRemoved, text }: { listing: FavoriteListing; onRemoved: () => void; text: (typeof labels)['ar'] }) {
  const { locale, localizedPath } = useI18n();
  const category = (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) || listing.category?.name || '';
  const badgeLabel = listing.promotion?.plan?.badgeLabel || text.featured;

  return (
    <Link href={localizedPath(`/listing/${listing.id}`)} className="group block overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-lg">
      <div className="relative h-56 overflow-hidden">
        <ListingMediaCover
          items={listing.images}
          alt={listing.title}
          fallbackSrc={fallbackImage}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          imageClassName="h-full w-full"
        />
        <FavoriteButton
          adId={listing.id}
          initialFavorited
          onChange={(favorited) => {
            if (!favorited) onRemoved();
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition hover:scale-110 hover:bg-white"
        />
        {listing.promotion ? <span className="absolute left-3 top-3 rounded-md bg-green-500 px-3 py-1 text-xs font-bold text-white">{badgeLabel}</span> : null}
        {category ? <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-3 py-1 text-xs text-white">{category}</span> : null}
      </div>
      <div className="p-4">
        <h3 className="mb-2 line-clamp-1 text-base font-bold text-gray-900">{listing.title}</h3>
        <p className="mb-3 text-xl font-bold text-green-600">{formatPrice(listing.price, listing.currency, locale)}</p>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={16} className="text-gray-400" />
          <span>{getListingLocationLabel(listing.city, listing.wilayah, listing.area, locale) || '-'}</span>
        </div>
      </div>
    </Link>
  );
}

function formatPrice(price: string | number | null | undefined, currency: string, locale: 'ar' | 'en') {
  if (price === null || price === undefined || price === '') return '-';
  const value = Number(price).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US');
  return locale === 'en' ? `${currency === 'OMR' ? 'OMR' : currency} ${value}` : `${value} ${currency === 'OMR' ? 'ر.ع' : currency}`;
}
