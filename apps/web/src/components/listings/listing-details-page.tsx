'use client';

import { Calendar, Eye, Flag, Mail, MapPin, Phone, Share2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { AvatarWithBanBadge } from '@/components/ui/avatar-with-ban-badge';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getListingLocationLabel } from '@/lib/oman-locations';
import { getStoredUser, getUserAccessToken } from '@/lib/user-auth';
import { getListingGalleryMedia, isListingVideo } from '@/lib/listing-media';
import { resolveMediaUrl } from '@/lib/media-url';
import { FavoriteButton } from './favorite-button';
import { ListingDetailSkeleton } from './listing-detail-skeleton';
import { ListingMediaCover } from './listing-media-cover';
import { ListingMediaGalleryModal } from './listing-media-gallery-modal';

type ListingImage = {
  imageUrl: string;
  mediaType?: 'IMAGE' | 'VIDEO';
};

type ListingUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  isBlocked?: boolean;
  createdAt?: string;
};

type ListingDetails = {
  id: string;
  title: string;
  description: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  wilayah?: string | null;
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
  store?: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
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
    storeListing: 'عرض متجر',
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
    inactiveNotice: 'هذا الإعلان غير متاح حالياً.',
    reportTitle: 'الإبلاغ عن الإعلان',
    reportPlaceholder: 'اكتب سبب البلاغ بالتفصيل...',
    reportSubmit: 'إرسال البلاغ',
    reportCancel: 'إلغاء',
    reportSuccess: 'تم إرسال البلاغ. شكراً لمساعدتنا.',
    reportError: 'تعذر إرسال البلاغ. حاول مرة أخرى.',
    reportLoginRequired: 'يجب تسجيل الدخول للإبلاغ عن الإعلان.',
    reportAlreadySent: 'لقد أبلغت عن هذا الإعلان مسبقاً.',
    reportOwnListing: 'لا يمكنك الإبلاغ عن إعلانك.',
    imageOf: 'صورة'
  },
  en: {
    loading: 'Loading listing...',
    notFound: 'Could not load listing.',
    views: 'views',
    description: 'Description',
    report: 'Report this listing',
    similar: 'Similar listings',
    sellerInfo: 'Seller information',
    storeListing: 'Store listing',
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
    inactiveNotice: 'This listing is not available right now.',
    reportTitle: 'Report this listing',
    reportPlaceholder: 'Describe the reason for your report...',
    reportSubmit: 'Submit report',
    reportCancel: 'Cancel',
    reportSuccess: 'Your report was sent. Thank you.',
    reportError: 'Could not send the report. Try again.',
    reportLoginRequired: 'Sign in to report this listing.',
    reportAlreadySent: 'You have already reported this listing.',
    reportOwnListing: 'You cannot report your own listing.',
    imageOf: 'Image'
  }
};

export function ListingDetailsPage({ id }: { id: string }) {
  const router = useRouter();
  const { dir, locale, localizedPath, m } = useI18n();
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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportError, setReportError] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

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

  const galleryItems = listing ? getListingGalleryMedia(listing.images) : [];
  const hasMedia = galleryItems.length > 0;
  const activeItem = galleryItems[activeImage] ?? galleryItems[0];
  const selectedMediaUrl = activeItem ? resolveMediaUrl(activeItem.imageUrl) : fallbackImage;
  const categoryName = listing ? getCategoryName(listing, locale) : '';
  const phone = listing?.contactPhone || listing?.user?.phone || '';

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: listing?.title, url: window.location.href }).catch(() => undefined);
      return;
    }
    navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
  };

  const openReportModal = () => {
    const token = getUserAccessToken();
    if (!token) {
      router.push(localizedPath('/login'));
      return;
    }

    const currentUser = getStoredUser();
    if (currentUser?.id && listing?.user?.id && currentUser.id === listing.user.id) {
      setReportError(text.reportOwnListing);
      return;
    }

    setReportReason('');
    setReportError('');
    setReportMessage('');
    setReportOpen(true);
  };

  const submitReport = async () => {
    const token = getUserAccessToken();
    if (!token || !listing) return;

    const reason = reportReason.trim();
    if (reason.length < 5) {
      setReportError(text.reportError);
      return;
    }

    setIsSubmittingReport(true);
    setReportError('');

    try {
      await api.post(
        `/ads/${listing.id}/reports`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReportMessage(text.reportSuccess);
      setReportReason('');
      window.setTimeout(() => setReportOpen(false), 1200);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) setReportError(text.reportAlreadySent);
      else if (status === 400) setReportError(text.reportOwnListing);
      else setReportError(text.reportError);
    } finally {
      setIsSubmittingReport(false);
    }
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
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {isLoading ? (
          <ListingDetailSkeleton />
        ) : error || !listing ? (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-red-600 shadow-sm">{error || text.notFound}</div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative h-96 bg-gray-100">
                  <button
                    type="button"
                    onClick={() => hasMedia && setGalleryOpen(true)}
                    className={`h-full w-full ${hasMedia ? 'cursor-zoom-in' : 'cursor-default'}`}
                    aria-label={hasMedia ? text.imageOf : undefined}
                  >
                    {activeItem && isListingVideo(activeItem) ? (
                      <video
                        src={selectedMediaUrl}
                        controls
                        playsInline
                        className="h-full w-full bg-black object-contain"
                      />
                    ) : (
                      <img
                        src={selectedMediaUrl}
                        alt={listing.title}
                        className={`h-full w-full ${hasMedia ? 'object-cover' : 'object-contain p-10'}`}
                      />
                    )}
                  </button>
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
                {galleryItems.length > 1 ? (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {galleryItems.slice(0, 8).map((item, index) => (
                      <button
                        key={`${item.imageUrl}-${index}`}
                        onClick={() => {
                          setActiveImage(index);
                          setGalleryOpen(true);
                        }}
                        className={`aspect-video overflow-hidden rounded-lg border-2 transition ${activeImage === index ? 'border-green-600' : 'border-transparent'}`}
                        type="button"
                      >
                        {isListingVideo(item) ? (
                          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs font-bold text-white">VIDEO</div>
                        ) : (
                          <img src={resolveMediaUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" />
                        )}
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
                      <Meta icon={<MapPin size={16} />} label={getListingLocationLabel(listing.city, listing.wilayah, listing.area, locale) || '-'} />
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
                  {reportError && !reportOpen ? (
                    <p className="mb-3 text-sm font-bold text-red-600">{reportError}</p>
                  ) : null}
                  <button
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    type="button"
                    onClick={openReportModal}
                  >
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
                  {listing.store ? (
                    <Link
                      href={localizedPath(`/stores/${listing.store.slug}`)}
                      className="mb-4 flex items-center gap-3 rounded-xl p-2 transition hover:bg-gray-50"
                    >
                      <AvatarWithBanBadge
                        src={listing.store.logoUrl ?? listing.user?.avatar}
                        alt={locale === 'en' ? listing.store.nameEn : listing.store.nameAr}
                        size={56}
                        isBlocked={listing.user?.isBlocked}
                        badgeLabel={listing.user?.isBlocked ? m.profileExtra.accountBlocked : undefined}
                        fallback={<User size={26} />}
                      />
                      <div>
                        <h4 className="font-bold">
                          {locale === 'en' ? listing.store.nameEn : listing.store.nameAr}
                        </h4>
                        <p className="text-sm font-bold text-green-700">{text.storeListing}</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="mb-4 flex items-center gap-3">
                      <AvatarWithBanBadge
                        src={listing.user?.avatar}
                        alt={listing.user?.fullName ?? ''}
                        size={56}
                        isBlocked={listing.user?.isBlocked}
                        badgeLabel={listing.user?.isBlocked ? m.profileExtra.accountBlocked : undefined}
                        fallback={<User size={26} />}
                      />
                      <div>
                        <h4 className="font-bold">{listing.user?.fullName ?? '-'}</h4>
                        <p className="text-sm text-gray-500">
                          {text.memberSince} {listing.user?.createdAt ? new Date(listing.user.createdAt).getFullYear() : '-'}
                        </p>
                      </div>
                    </div>
                  )}
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

      {galleryOpen && hasMedia ? (
        <ListingMediaGalleryModal
          items={galleryItems}
          initialIndex={activeImage}
          title={listing?.title}
          mediaLabel={text.imageOf}
          dir={dir}
          onClose={(finalIndex) => {
            if (finalIndex !== undefined) setActiveImage(finalIndex);
            setGalleryOpen(false);
          }}
        />
      ) : null}

      {reportOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-black text-slate-900">{text.reportTitle}</h2>
            {reportMessage ? (
              <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{reportMessage}</p>
            ) : null}
            {reportError ? (
              <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{reportError}</p>
            ) : null}
            <textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              placeholder={text.reportPlaceholder}
              className="min-h-32 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                disabled={isSubmittingReport}
                onClick={submitReport}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {text.reportSubmit}
              </button>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700"
              >
                {text.reportCancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </div>
  );
}

function SimilarCard({ item }: { item: ListingDetails }) {
  const { locale, localizedPath } = useI18n();

  return (
    <Link className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition hover:shadow-md" href={localizedPath(`/listing/${item.id}`)}>
      <ListingMediaCover
        items={item.images}
        alt={item.title}
        fallbackSrc={fallbackImage}
        className="h-32 w-full"
        imageClassName="h-32 w-full"
      />
      <div className="p-3">
        <h3 className="mb-2 line-clamp-1 text-sm font-bold">{item.title}</h3>
        <p className="mb-1 font-bold text-green-600">{formatPrice(item.price, item.currency, locale)}</p>
        <p className="text-xs text-gray-500">{getListingLocationLabel(item.city, item.wilayah, item.area, locale) || '-'}</p>
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
