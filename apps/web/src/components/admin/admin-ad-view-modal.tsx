'use client';

import { ExternalLink, Power, PowerOff, RotateCcw, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';

import { AdminAdMediaPreview } from '@/components/admin/admin-ad-media';
import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';
import { getListingGalleryMedia } from '@/lib/listing-media';
import { getListingLocationLabel } from '@/lib/oman-locations';

type AdStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | 'ARCHIVED';

type AdminAdDetail = {
  id: string;
  title: string;
  description: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  wilayah?: string | null;
  area?: string | null;
  contactPhone?: string | null;
  status: AdStatus;
  isApproved: boolean;
  isActive: boolean;
  isSold: boolean;
  views: number;
  createdAt: string;
  deletedAt?: string | null;
  user?: { fullName: string; email: string; phone?: string | null } | null;
  category?: { name?: string; nameAr?: string; nameEn?: string } | null;
  images?: Array<{ imageUrl: string; mediaType?: string }>;
  promotion?: {
    plan?: {
      badgeLabel?: string | null;
      nameAr?: string | null;
      nameEn?: string | null;
      priorityScore?: number | null;
    } | null;
  } | null;
};

type AdminAdViewModalProps = {
  adId: string;
  onClose: () => void;
  onChanged?: () => void;
};

const labels = {
  ar: {
    details: 'تفاصيل العرض',
    seller: 'المعلن',
    category: 'الفئة',
    status: 'الحالة',
    visibility: 'الظهور',
    approved: 'معتمد',
    notApproved: 'غير معتمد',
    sold: 'مباع',
    deleted: 'محذوف',
    views: 'المشاهدات',
    location: 'الموقع',
    phone: 'الهاتف',
    promotionScore: 'درجة الترويج',
    noPromotion: 'بدون ترويج',
    createdAt: 'تاريخ الإنشاء',
    price: 'السعر',
    images: 'الصور',
    activate: 'تفعيل',
    deactivate: 'إلغاء التفعيل',
    viewOnSite: 'عرض على الموقع',
    delete: 'حذف',
    restore: 'استعادة',
    confirmDelete: 'هل تريد حذف هذا العرض؟',
    loadError: 'تعذر تحميل تفاصيل العرض.'
  },
  en: {
    details: 'Ad details',
    seller: 'Seller',
    category: 'Category',
    status: 'Status',
    visibility: 'Visibility',
    approved: 'Approved',
    notApproved: 'Not approved',
    sold: 'Sold',
    deleted: 'Deleted',
    views: 'Views',
    location: 'Location',
    phone: 'Phone',
    promotionScore: 'Promotion score',
    noPromotion: 'No promotion',
    createdAt: 'Created at',
    price: 'Price',
    images: 'Images',
    activate: 'Activate',
    deactivate: 'Deactivate',
    viewOnSite: 'View on site',
    delete: 'Delete',
    restore: 'Restore',
    confirmDelete: 'Delete this ad?',
    loadError: 'Could not load ad details.'
  }
};

export function AdminAdViewModal({ adId, onClose, onChanged }: AdminAdViewModalProps) {
  const { locale, localizedPath, m } = useI18n();
  const text = labels[locale];
  const [ad, setAd] = useState<AdminAdDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActing, setIsActing] = useState(false);

  const statusLabel = (status: AdStatus) => m.admin.adStatus[status] ?? status;
  const categoryName = (category: AdminAdDetail['category']) => {
    if (!category) return '-';
    if (locale === 'ar') return category.nameAr || category.name || '-';
    return category.nameEn || category.name || '-';
  };
  const promotionName = (item: AdminAdDetail) => {
    const plan = item.promotion?.plan;
    if (!plan) return text.noPromotion;
    return plan.badgeLabel || (locale === 'ar' ? plan.nameAr : plan.nameEn) || text.noPromotion;
  };
  const promotionScore = (item: AdminAdDetail) => item.promotion?.plan?.priorityScore ?? 0;

  const loadAd = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminApi().get<{ data: AdminAdDetail }>(`/admin/ads/${adId}`);
      setAd(response.data.data);
    } catch {
      setError(text.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAd().catch(() => undefined);
  }, [adId]);

  const notifyChanged = () => {
    onChanged?.();
    loadAd().catch(() => undefined);
  };

  const deleteAd = async () => {
    if (!ad || !window.confirm(text.confirmDelete)) return;
    setIsActing(true);
    try {
      await adminApi().delete(`/admin/ads/${ad.id}`);
      notifyChanged();
      onClose();
    } finally {
      setIsActing(false);
    }
  };

  const restoreAd = async () => {
    if (!ad) return;
    setIsActing(true);
    try {
      await adminApi().post(`/admin/ads/${ad.id}/restore`);
      notifyChanged();
      onClose();
    } finally {
      setIsActing(false);
    }
  };

  const toggleActive = async () => {
    if (!ad) return;
    setIsActing(true);
    try {
      if (ad.isActive) {
        await adminApi().post(`/admin/ads/${ad.id}/deactivate`);
      } else {
        await adminApi().post(`/admin/ads/${ad.id}/activate`);
      }
      notifyChanged();
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">{text.details}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 transition hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <AdModalSkeleton />
        ) : error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>
        ) : ad ? (
          <>
            <AdminAdMediaPreview images={ad.images} alt={ad.title} className="mb-4 h-72 w-full rounded-2xl object-cover" />
            <h3 className="text-2xl font-black">{ad.title}</h3>
            <p className="mt-2 font-bold text-brand-600">{formatPrice(ad.price, ad.currency)}</p>
            <p className="mt-4 whitespace-pre-line text-slate-700">{ad.description}</p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <DetailItem label={text.seller} value={ad.user ? `${ad.user.fullName} (${ad.user.email})` : '-'} />
              <DetailItem label={text.category} value={categoryName(ad.category)} />
              <DetailItem label={text.status} value={statusLabel(ad.status)} />
              <DetailItem label={text.visibility} value={ad.isActive ? m.admin.activeListing : m.admin.inactive} />
              <DetailItem label={text.approved} value={ad.isApproved ? text.approved : text.notApproved} />
              <DetailItem label={text.sold} value={ad.isSold ? text.sold : '-'} />
              <DetailItem label={text.deleted} value={ad.deletedAt ? text.deleted : '-'} />
              <DetailItem label={text.views} value={ad.views.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')} />
              <DetailItem
                label={text.location}
                value={getListingLocationLabel(ad.city, ad.wilayah, ad.area, locale) || '-'}
              />
              <DetailItem label={text.phone} value={ad.contactPhone || ad.user?.phone || '-'} />
              <DetailItem
                label={text.promotionScore}
                value={`${promotionName(ad)} · ${promotionScore(ad).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')}`}
              />
              <DetailItem
                label={text.createdAt}
                value={new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-US').format(new Date(ad.createdAt))}
              />
            </div>

            {ad.images && ad.images.length > 1 ? (
              <div className="mt-6">
                <p className="mb-2 text-sm font-bold text-slate-700">{text.images}</p>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                  {getListingGalleryMedia(ad.images).map((image) => (
                    <AdminAdMediaPreview
                      key={image.imageUrl}
                      images={[image]}
                      alt={ad.title}
                      className="h-20 w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={localizedPath(`/listing/${ad.id}`)}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-bold text-white transition hover:bg-slate-800"
              >
                <ExternalLink size={16} />
                {text.viewOnSite}
              </Link>
              {!ad.deletedAt ? (
                <button
                  type="button"
                  disabled={isActing}
                  onClick={toggleActive}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold disabled:opacity-50 ${
                    ad.isActive ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-600'
                  }`}
                >
                  {ad.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                  {ad.isActive ? text.deactivate : text.activate}
                </button>
              ) : null}
              {ad.deletedAt ? (
                <button
                  type="button"
                  disabled={isActing}
                  onClick={restoreAd}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 font-bold text-green-600 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  {text.restore}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isActing}
                  onClick={deleteAd}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-bold text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {text.delete}
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function AdModalSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-8 w-2/3 animate-pulse rounded-full bg-slate-200" />
      <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-1 break-words font-bold text-slate-900">{value}</div>
    </div>
  );
}

function formatPrice(price: string | number | null | undefined, currency: string) {
  if (price === null || price === undefined || price === '') return '-';
  return `${Number(price).toLocaleString()} ${currency === 'OMR' ? 'ر.ع' : currency}`;
}
