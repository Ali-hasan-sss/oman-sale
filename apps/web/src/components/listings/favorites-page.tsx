'use client';

import { Globe, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';
import { useAuthStore } from '@/store/auth-store';
import { FavoriteButton } from './favorite-button';

type FavoriteListing = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
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

export function FavoritesPage() {
  const router = useRouter();
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
  const text = labels[locale];
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const [listings, setListings] = useState<FavoriteListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    hydrateFromStorage();
    const token = getUserAccessToken();
    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    api
      .get<{ data: FavoriteListing[] }>('/ads/favorites', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setListings(response.data.data))
      .catch(() => setListings([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link className="flex items-center gap-3" href={localizedPath('/')}>
              <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
            </Link>
            <MobileNavMenu />
            <div className="hidden items-center gap-4 lg:flex">
              <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition hover:bg-gray-50" onClick={toggleLocale} type="button">
                <Globe size={18} />
                <span className="text-sm">{m.common.languageSwitch}</span>
              </button>
              <ChatNavLink className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
              <HeaderLink href="/all-listings" label={m.common.allListings} />
              <HeaderLink href="/my-listings" label={m.common.myListings} />
              <Link className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700" href={localizedPath('/add-listing')}>
                {m.common.addListing}
              </Link>
              <HeaderAuthAction loginClassName="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
            </div>
          </div>
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
            <input
              type="text"
              placeholder={m.home.searchPlaceholder}
              className={`w-full rounded-lg border border-gray-300 py-3 outline-none focus:ring-2 focus:ring-green-500 ${dir === 'rtl' ? 'pl-4 pr-12' : 'pl-12 pr-4'}`}
            />
          </div>
        </div>
      </header>

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
      </main>

      <SiteFooter />
    </div>
  );

  function HeaderLink({ href, label }: { href: string; label: string }) {
    return (
      <Link className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" href={localizedPath(href)}>
        {label}
      </Link>
    );
  }
}

function FavoriteCard({ listing, onRemoved, text }: { listing: FavoriteListing; onRemoved: () => void; text: (typeof labels)['ar'] }) {
  const { locale, localizedPath } = useI18n();
  const category = (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) || listing.category?.name || '';
  const image = listing.images?.[0]?.imageUrl;
  const badgeLabel = listing.promotion?.plan?.badgeLabel || text.featured;

  return (
    <Link href={localizedPath(`/listing/${listing.id}`)} className="group block overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-lg">
      <div className="relative h-56 overflow-hidden">
        <img
          src={image || fallbackImage}
          alt={listing.title}
          className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${image ? 'object-cover' : 'object-contain p-8'}`}
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
          <span>{listing.area || listing.city || '-'}</span>
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
