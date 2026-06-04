'use client';

import { Megaphone } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { SiteFooter } from '@/components/home/site-footer';
import { UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { resolveApiErrorMessage } from '@/lib/api-errors';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';

type BannerPricing = {
  pricePerDay: number;
  minDays: number;
  maxDays: number;
};

const labels = {
  ar: {
    title: 'إعلان في بنر الصفحة الرئيسية',
    subtitle: 'ارفع إعلانك ليظهر في بنر العروض المميزة بعد الدفع وموافقة الإدارة',
    imageUrl: 'رابط صورة الإعلان *',
    linkUrl: 'رابط الإعلان عند النقر *',
    textAr: 'نص الإعلان (عربي)',
    textEn: 'نص الإعلان (إنجليزي)',
    durationDays: 'عدد الأيام *',
    pricePerDay: 'السعر لليوم',
    totalPrice: 'الإجمالي',
    omr: 'ر.ع',
    submit: 'متابعة الدفع',
    submitting: 'جاري المعالجة...',
    loginRequired: 'يجب تسجيل الدخول أولاً',
    loadError: 'تعذر تحميل الأسعار.',
    createError: 'تعذر إرسال الطلب. تحقق من البيانات وحاول مرة أخرى.',
    preview: 'معاينة الصورة',
    daysHint: 'يوم'
  },
  en: {
    title: 'Homepage banner advertisement',
    subtitle: 'Submit your ad to appear in the featured offers banner after payment and admin approval',
    imageUrl: 'Ad image URL *',
    linkUrl: 'Ad click-through link *',
    textAr: 'Ad text (Arabic)',
    textEn: 'Ad text (English)',
    durationDays: 'Number of days *',
    pricePerDay: 'Price per day',
    totalPrice: 'Total',
    omr: 'OMR',
    submit: 'Continue to payment',
    submitting: 'Processing...',
    loginRequired: 'Please sign in first',
    loadError: 'Could not load pricing.',
    createError: 'Could not submit the request. Check your details and try again.',
    preview: 'Image preview',
    daysHint: 'days'
  }
} as const;

function formatOmrAmount(value: number) {
  return new Intl.NumberFormat('en-OM', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(value);
}

export function BannerAdRequestPage() {
  const router = useRouter();
  const { locale, dir, localizedPath, m } = useI18n();
  const text = labels[locale];
  const [pricing, setPricing] = useState<BannerPricing | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [textAr, setTextAr] = useState('');
  const [textEn, setTextEn] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const totalPrice = useMemo(() => {
    if (!pricing) return 0;
    return Number((pricing.pricePerDay * durationDays).toFixed(3));
  }, [durationDays, pricing]);

  useEffect(() => {
    if (!getUserAccessToken()) {
      router.replace(localizedPath('/login'));
      return;
    }

    api
      .get<{ data: BannerPricing }>('/banner-requests/pricing')
      .then((response) => {
        setPricing(response.data.data);
        setDurationDays(response.data.data.minDays);
      })
      .catch(() => setError(text.loadError))
      .finally(() => setLoading(false));
  }, [localizedPath, router, text.loadError]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await api.post<{
        data: {
          request: { id: string };
          checkout: { paid?: boolean; paymentUrl?: string };
        };
      }>('/banner-requests', {
        imageUrl,
        linkUrl,
        textAr: textAr || undefined,
        textEn: textEn || undefined,
        durationDays
      });

      const paymentUrl = response.data.data.checkout.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      router.push(localizedPath('/banner-ad/success'));
    } catch (submitError) {
      setError(resolveApiErrorMessage(submitError, m.errors, text.createError));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  return (
    <div className="min-h-screen bg-slate-50" dir={dir}>
      <UserSiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Megaphone size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-900">{text.title}</h1>
          <p className="mt-2 text-slate-600">{text.subtitle}</p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center font-bold text-slate-500 shadow-sm">{text.submitting}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{text.imageUrl}</label>
              <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className={inputClass} required type="url" />
              {imageUrl ? (
                <img src={imageUrl} alt={text.preview} className="mt-3 aspect-[990/250] w-full rounded-xl object-cover ring-1 ring-slate-200" />
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{text.linkUrl}</label>
              <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} className={inputClass} required dir="ltr" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">{text.textAr}</label>
                <input value={textAr} onChange={(event) => setTextAr(event.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">{text.textEn}</label>
                <input value={textEn} onChange={(event) => setTextEn(event.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{text.durationDays}</label>
              <input
                type="number"
                min={pricing?.minDays ?? 1}
                max={pricing?.maxDays ?? 90}
                value={durationDays}
                onChange={(event) => setDurationDays(Number(event.target.value))}
                className={inputClass}
                required
              />
            </div>

            {pricing ? (
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{text.pricePerDay}</span>
                  <span dir="ltr">
                    {formatOmrAmount(pricing.pricePerDay)} {text.omr}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-lg font-black text-brand-700">
                  <span>{text.totalPrice}</span>
                  <span dir="ltr">
                    {formatOmrAmount(totalPrice)} {text.omr}
                  </span>
                </div>
              </div>
            ) : null}

            {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting || !pricing}
              className="w-full rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? text.submitting : text.submit}
            </button>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
