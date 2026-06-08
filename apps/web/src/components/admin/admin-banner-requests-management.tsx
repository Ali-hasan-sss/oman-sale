'use client';

import { Check, ImageIcon, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { resolveMediaUrl } from '@/lib/media-url';
import { useI18n } from '@/lib/i18n';

type BannerPricing = {
  id: string;
  pricePerDay: number;
  minDays: number;
  maxDays: number;
  isActive: boolean;
};

type BannerRequest = {
  id: string;
  user: { id: string; fullName: string; email: string };
  imageUrl: string;
  linkUrl: string;
  textAr?: string | null;
  textEn?: string | null;
  durationDays: number;
  totalPrice: number;
  status: string;
  rejectionReason?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  payment?: { status: string; amount: number } | null;
};

const statusLabels = {
  ar: {
    PENDING_PAYMENT: 'بانتظار الدفع',
    PENDING_APPROVAL: 'بانتظار الموافقة',
    REJECTED: 'مرفوض',
    ACTIVE: 'نشط',
    EXPIRED: 'منتهي',
    CANCELLED: 'ملغي'
  },
  en: {
    PENDING_PAYMENT: 'Pending payment',
    PENDING_APPROVAL: 'Pending approval',
    REJECTED: 'Rejected',
    ACTIVE: 'Active',
    EXPIRED: 'Expired',
    CANCELLED: 'Cancelled'
  }
} as const;

function formatOmrAmount(value: number) {
  return new Intl.NumberFormat('en-OM', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(value);
}

export function AdminBannerRequestsManagement() {
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const [, setPricing] = useState<BannerPricing | null>(null);
  const [requests, setRequests] = useState<BannerRequest[]>([]);
  const [filter, setFilter] = useState('PENDING_APPROVAL');
  const [loading, setLoading] = useState(true);
  const [savingPricing, setSavingPricing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [pricePerDay, setPricePerDay] = useState('2');
  const [minDays, setMinDays] = useState('1');
  const [maxDays, setMaxDays] = useState('90');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pricingResponse, requestsResponse] = await Promise.all([
        adminApi().get<{ data: BannerPricing }>('/admin/banner-pricing'),
        adminApi().get<{ data: BannerRequest[] }>('/admin/banner-requests', {
          params: filter ? { status: filter } : undefined
        })
      ]);
      setPricing(pricingResponse.data.data);
      setPricePerDay(String(pricingResponse.data.data.pricePerDay));
      setMinDays(String(pricingResponse.data.data.minDays));
      setMaxDays(String(pricingResponse.data.data.maxDays));
      setRequests(requestsResponse.data.data);
    } catch {
      setError(isAr ? 'تعذر تحميل بيانات إعلانات البنر.' : 'Could not load banner ad data.');
    } finally {
      setLoading(false);
    }
  }, [filter, isAr]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const savePricing = async (event: FormEvent) => {
    event.preventDefault();
    setSavingPricing(true);
    setMessage('');
    setError('');
    try {
      const response = await adminApi().patch<{ data: BannerPricing }>('/admin/banner-pricing', {
        pricePerDay: Number(pricePerDay),
        minDays: Number(minDays),
        maxDays: Number(maxDays),
        isActive: true
      });
      setPricing(response.data.data);
      setMessage(isAr ? 'تم حفظ التسعير.' : 'Pricing saved.');
    } catch {
      setError(isAr ? 'تعذر حفظ التسعير.' : 'Could not save pricing.');
    } finally {
      setSavingPricing(false);
    }
  };

  const approveRequest = async (id: string) => {
    setProcessingId(id);
    setError('');
    try {
      await adminApi().post(`/admin/banner-requests/${id}/approve`);
      setMessage(isAr ? 'تمت الموافقة على الطلب ونشر الإعلان.' : 'Request approved and banner published.');
      await loadData();
    } catch {
      setError(isAr ? 'تعذر الموافقة على الطلب.' : 'Could not approve request.');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!rejectId) return;
    setProcessingId(rejectId);
    setError('');
    try {
      await adminApi().post(`/admin/banner-requests/${rejectId}/reject`, { reason: rejectReason });
      setRejectId(null);
      setRejectReason('');
      setMessage(isAr ? 'تم رفض الطلب.' : 'Request rejected.');
      await loadData();
    } catch {
      setError(isAr ? 'تعذر رفض الطلب.' : 'Could not reject request.');
    } finally {
      setProcessingId(null);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <ImageIcon size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {isAr ? 'طلبات إعلانات البنر' : 'Banner ad requests'}
          </h2>
          <p className="text-sm text-slate-500">
            {isAr ? 'إدارة التسعير ومراجعة طلبات المستخدمين' : 'Manage pricing and review user requests'}
          </p>
        </div>
      </div>

      <form onSubmit={savePricing} className="mb-8 grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-slate-700">
            {isAr ? 'السعر لليوم (ر.ع)' : 'Price per day (OMR)'}
          </label>
          <input value={pricePerDay} onChange={(event) => setPricePerDay(event.target.value)} className={inputClass} required type="number" min="0.001" step="0.001" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-slate-700">{isAr ? 'أقل مدة (أيام)' : 'Min days'}</label>
          <input value={minDays} onChange={(event) => setMinDays(event.target.value)} className={inputClass} required type="number" min="1" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-slate-700">{isAr ? 'أقصى مدة (أيام)' : 'Max days'}</label>
          <input value={maxDays} onChange={(event) => setMaxDays(event.target.value)} className={inputClass} required type="number" min="1" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={savingPricing} className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-bold text-white hover:bg-brand-700 disabled:opacity-60">
            {savingPricing ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ التسعير' : 'Save pricing'}
          </button>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {['PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'EXPIRED', 'PENDING_PAYMENT', ''].map((status) => (
          <button
            key={status || 'all'}
            type="button"
            onClick={() => setFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filter === status ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status
              ? statusLabels[locale][status as keyof typeof statusLabels.ar]
              : isAr
                ? 'الكل'
                : 'All'}
          </button>
        ))}
      </div>

      {message ? <p className="mb-4 text-sm font-bold text-green-700">{message}</p> : null}
      {error ? <p className="mb-4 text-sm font-bold text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-center font-bold text-slate-500">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : requests.length === 0 ? (
        <p className="text-center font-bold text-slate-500">{isAr ? 'لا توجد طلبات.' : 'No requests found.'}</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="grid gap-4 lg:grid-cols-[240px_1fr_auto]">
                <img src={resolveMediaUrl(request.imageUrl)} alt="" className="aspect-[990/250] w-full rounded-xl object-cover ring-1 ring-slate-200" />
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-bold">{isAr ? 'المستخدم:' : 'User:'}</span> {request.user.fullName} ({request.user.email})
                  </p>
                  <p dir="ltr">
                    <span className="font-bold">{isAr ? 'الرابط:' : 'Link:'}</span> {request.linkUrl}
                  </p>
                  <p>
                    <span className="font-bold">{isAr ? 'المدة:' : 'Duration:'}</span> {request.durationDays}{' '}
                    {isAr ? 'يوم' : 'days'}
                  </p>
                  <p>
                    <span className="font-bold">{isAr ? 'السعر:' : 'Price:'}</span> {formatOmrAmount(request.totalPrice)} OMR
                  </p>
                  <p>
                    <span className="font-bold">{isAr ? 'الحالة:' : 'Status:'}</span>{' '}
                    {statusLabels[locale][request.status as keyof typeof statusLabels.ar] ?? request.status}
                  </p>
                  {request.endsAt ? (
                    <p>
                      <span className="font-bold">{isAr ? 'ينتهي في:' : 'Ends at:'}</span>{' '}
                      {new Date(request.endsAt).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
                    </p>
                  ) : null}
                  {request.rejectionReason ? (
                    <p className="text-red-600">
                      <span className="font-bold">{isAr ? 'سبب الرفض:' : 'Rejection reason:'}</span> {request.rejectionReason}
                    </p>
                  ) : null}
                </div>
                {request.status === 'PENDING_APPROVAL' ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => approveRequest(request.id)}
                      disabled={processingId === request.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      <Check size={16} />
                      {isAr ? 'موافقة' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectId(request.id);
                        setRejectReason('');
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 font-bold text-red-600 hover:bg-red-50"
                    >
                      <X size={16} />
                      {isAr ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {rejectId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={rejectRequest} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-black">{isAr ? 'رفض الطلب' : 'Reject request'}</h3>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              className={`${inputClass} min-h-28`}
              required
              placeholder={isAr ? 'سبب الرفض' : 'Rejection reason'}
            />
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={processingId === rejectId} className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white">
                {isAr ? 'تأكيد الرفض' : 'Confirm reject'}
              </button>
              <button type="button" onClick={() => setRejectId(null)} className="rounded-xl border border-slate-200 px-4 py-2 font-bold">
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
