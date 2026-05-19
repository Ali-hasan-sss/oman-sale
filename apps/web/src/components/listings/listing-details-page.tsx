'use client';

import { Calendar, Eye, Flag, Globe, Mail, MapPin, Phone, Search, Share2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getStoredUser, getUserAccessToken } from '@/lib/user-auth';
import { FavoriteButton } from './favorite-button';

type ListingImage = {
  imageUrl: string;
};

type ListingUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  createdAt?: string;
};

type ListingDetails = {
  id: string;
  title: string;
  description: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  area?: string | null;
  contactPhone?: string | null;
  views: number;
  createdAt: string;
  isSold?: boolean;
  isActive?: boolean;
  images: ListingImage[];
  category?: {
    name?: string;
    nameAr?: string;
    nameEn?: string;
  } | null;
  user?: ListingUser | null;
};

const fallbackImage = '/logo.png';

const labels = {
  ar: {
    loading: 'جاري تحميل الإعلان...',
    notFound: 'تعذر تحميل الإعلان.',
    views: 'مشاهدة',
    description: 'الوصف',
    report: 'الإبلاغ عن هذا الإعلان',
    similar: 'إعلانات مشابهة',
    sellerInfo: 'معلومات البائع',
    memberSince: 'عضو منذ',
    showPhone: 'إظهار رقم الهاتف',
    sendMessage: 'أرسل رسالة',
    contactInfo: 'معلومات الاتصال:',
    safetyTitle: 'نصيحة أمنية:',
    safetyText: 'تحقق من البائع قبل الشراء. لا تدفع أي مبالغ مقدماً قبل معاينة المنتج.',
    noSimilar: 'لا توجد إعلانات مشابهة حاليًا.',
    phoneUnavailable: 'رقم الهاتف غير متاح',
    cannotMessageSelf: 'لا يمكنك إنشاء محادثة مع نفسك.',
    chatError: 'تعذر إنشاء المحادثة. حاول مرة أخرى.',
    soldBadge: 'مباع',
    inactiveNotice: 'هذا الإعلان غير متاح حالياً.'
  },
  en: {
    loading: 'Loading listing...',
    notFound: 'Could not load listing.',
    views: 'views',
    description: 'Description',
    report: 'Report this listing',
    similar: 'Similar listings',
    sellerInfo: 'Seller information',
    memberSince: 'Member since',
    showPhone: 'Show phone number',
    sendMessage: 'Send message',
    contactInfo: 'Contact information:',
    safetyTitle: 'Safety tip:',
    safetyText: 'Verify the seller before buying. Do not pay in advance before inspecting the item.',
    noSimilar: 'No similar listings are available right now.',
    phoneUnavailable: 'Phone number unavailable',
    cannotMessageSelf: 'You cannot start a conversation with yourself.',
    chatError: 'Could not start the conversation. Try again.',
    soldBadge: 'Sold',
    inactiveNotice: 'This listing is not available right now.'
  }
};

export function ListingDetailsPage({ id }: { id: string }) {
  const router = useRouter();
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
  const text = labels[locale];
  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [similar, setSimilar] = useState<ListingDetails[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [chatError, setChatError] = useState('');
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get<{ data: ListingDetails }>(`/ads/${id}`),
      api.get<{ data: ListingDetails[] }>(`/ads/${id}/similar`)
    ])
      .then(([listingResponse, similarResponse]) => {
        setListing(listingResponse.data.data);
        setSimilar(similarResponse.data.data);
      })
      .catch(() => setError(text.notFound))
      .finally(() => setIsLoading(false));
  }, [id, text.notFound]);

  useEffect(() => {
    const token = getUserAccessToken();
    if (!token) return;

    api
      .get<{ data: string[] }>('/ads/favorites/ids', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setIsFavorited(response.data.data.includes(id)))
      .catch(() => setIsFavorited(false));
  }, [id]);

  const hasImages = Boolean(listing?.images.length);
  const images = hasImages && listing ? listing.images.map((image) => image.imageUrl) : [fallbackImage];
  const selectedImage = images[activeImage] ?? images[0] ?? fallbackImage;
  const categoryName = listing ? getCategoryName(listing, locale) : '';
  const phone = listing?.contactPhone || listing?.user?.phone || '';

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: listing?.title, url: window.location.href }).catch(() => undefined);
      return;
    }
    navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
  };

  const openConversation = async () => {
    const token = getUserAccessToken();
    if (!token) {
      router.push(localizedPath('/login'));
      return;
    }

    const currentUser = getStoredUser();
    if (!listing?.user?.id) return;
    if (currentUser?.id === listing.user.id) {
      setChatError(text.cannotMessageSelf);
      return;
    }

    setChatError('');
    setIsOpeningChat(true);

    try {
      const response = await api.post<{ data: { id: string } }>(
        '/chat/conversations',
        { adId: listing.id, receiverId: listing.user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push(localizedPath(`/chat/${response.data.data.id}`));
    } catch {
      setChatError(text.chatError);
    } finally {
      setIsOpeningChat(false);
    }
  };

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
        {isLoading ? (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-gray-500 shadow-sm">{text.loading}</div>
        ) : error || !listing ? (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-red-600 shadow-sm">{error || text.notFound}</div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative h-96 bg-gray-100">
                  <img src={selectedImage} alt={listing.title} className={`h-full w-full ${hasImages ? 'object-cover' : 'object-contain p-10'}`} />
                  <div className="absolute right-4 top-4 flex gap-2">
                    <FavoriteButton
                      adId={id}
                      initialFavorited={isFavorited}
                      iconSize={20}
                      onChange={setIsFavorited}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-110"
                    />
                    <button onClick={share} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-110" type="button">
                      <Share2 size={20} className="text-gray-600" />
                    </button>
                  </div>
                </div>
                {images.length > 1 ? (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {images.slice(0, 8).map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        onClick={() => setActiveImage(index)}
                        className={`aspect-video overflow-hidden rounded-lg border-2 transition ${activeImage === index ? 'border-green-600' : 'border-transparent'}`}
                        type="button"
                      >
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {categoryName ? <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">{categoryName}</span> : null}
                      {listing.isSold ? <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">{text.soldBadge}</span> : null}
                    </div>
                    <h1 className="mb-3 text-3xl font-bold">{listing.title}</h1>
                    {listing.isActive === false ? <p className="mb-3 text-sm font-bold text-red-600">{text.inactiveNotice}</p> : null}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <Meta icon={<MapPin size={16} />} label={listing.area || listing.city || '-'} />
                      <Meta icon={<Calendar size={16} />} label={formatDate(listing.createdAt, locale)} />
                      <Meta icon={<Eye size={16} />} label={`${listing.views} ${text.views}`} />
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-4xl font-bold text-green-600">{formatPrice(listing.price, listing.currency, locale)}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="mb-4 text-xl font-bold">{text.description}</h2>
                  <div className="whitespace-pre-line leading-relaxed text-gray-700">{listing.description}</div>
                </div>
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <button className="flex items-center gap-2 text-red-600 hover:text-red-700" type="button">
                    <Flag size={18} />
                    <span className="text-sm">{text.report}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold">{text.similar}</h2>
                {similar.length === 0 ? (
                  <p className="text-sm text-gray-500">{text.noSimilar}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {similar.map((item) => (
                      <SimilarCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-4 rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-bold">{text.sellerInfo}</h3>
                <div className="mb-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-600 to-teal-600 text-xl font-bold text-white">
                      {listing.user?.avatar ? <img src={listing.user.avatar} alt={listing.user.fullName} className="h-full w-full object-cover" /> : <User size={26} />}
                    </div>
                    <div>
                      <h4 className="font-bold">{listing.user?.fullName ?? '-'}</h4>
                      <p className="text-sm text-gray-500">
                        {text.memberSince} {listing.user?.createdAt ? new Date(listing.user.createdAt).getFullYear() : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <button onClick={() => setShowPhone(true)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700" type="button">
                    <Phone size={20} />
                    <span>{showPhone ? phone || text.phoneUnavailable : text.showPhone}</span>
                  </button>
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-600 px-6 py-3 font-bold text-green-600 transition hover:bg-green-50 disabled:opacity-60"
                    disabled={isOpeningChat}
                    onClick={openConversation}
                    type="button"
                  >
                    <Mail size={20} />
                    <span>{text.sendMessage}</span>
                  </button>
                  {chatError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600">{chatError}</p> : null}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="mb-2 text-sm text-gray-600">{text.contactInfo}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone size={16} className="text-green-600" />
                      <button onClick={() => setShowPhone(true)} className="font-medium text-green-600 hover:underline" type="button">
                        {showPhone ? phone || text.phoneUnavailable : text.showPhone}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail size={16} className="text-green-600" />
                      <span dir="ltr">{listing.user?.email ?? '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>{text.safetyTitle}</strong> {text.safetyText}
                  </p>
                </div>
              </div>
            </aside>
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

function SimilarCard({ item }: { item: ListingDetails }) {
  const { locale, localizedPath } = useI18n();
  const image = item.images[0]?.imageUrl;

  return (
    <Link className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition hover:shadow-md" href={localizedPath(`/listing/${item.id}`)}>
      <img src={image || fallbackImage} alt={item.title} className={`h-32 w-full ${image ? 'object-cover' : 'object-contain p-6'}`} />
      <div className="p-3">
        <h3 className="mb-2 line-clamp-1 text-sm font-bold">{item.title}</h3>
        <p className="mb-1 font-bold text-green-600">{formatPrice(item.price, item.currency, locale)}</p>
        <p className="text-xs text-gray-500">{item.area || item.city || '-'}</p>
      </div>
    </Link>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function getCategoryName(listing: ListingDetails, locale: 'ar' | 'en') {
  return (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) || listing.category?.name || '';
}

function formatPrice(price: string | number | null | undefined, currency: string, locale: 'ar' | 'en') {
  if (price === null || price === undefined || price === '') return '-';
  const value = Number(price).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US');
  return locale === 'en' ? `${currency === 'OMR' ? 'OMR' : currency} ${value}` : `${value} ${currency === 'OMR' ? 'ر.ع' : currency}`;
}

function formatDate(value: string, locale: 'ar' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-US').format(new Date(value));
}
