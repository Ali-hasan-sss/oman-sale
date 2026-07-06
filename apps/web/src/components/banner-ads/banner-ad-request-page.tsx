'use client';

import { Megaphone } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { SiteFooter } from '@/components/home/site-footer';
import { ImageUploader } from '@/components/media/image-uploader';
import { UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { resolveApiErrorMessage } from '@/lib/api-errors';
import { hasBannerAdPrefill, readBannerAdPrefill } from '@/lib/banner-ad-prefill';
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
    imageTitle: 'صورة الإعلان *',
    imageHint: 'مقاس عريض مفضل (990×250) — يُضغط تلقائياً',
    imageUploading: 'جاري رفع الصورة...',
    imageCompressing: 'جاري ضغط الصورة...',
    imageUploadError: 'تعذر رفع صورة الإعلان.',
    removeImage: 'إزالة الصورة',
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
    daysHint: 'يوم',
    prefilledHint: 'تم تعبئة النموذج من إعلانك. راجع التفاصيل ثم أرسل الطلب.'
  },
  en: {
    title: 'Homepage banner advertisement',
    subtitle: 'Submit your ad to appear in the featured offers banner after payment and admin approval',
    imageTitle: 'Ad image *',
    imageHint: 'Wide format recommended (990×250) — auto-compressed',
    imageUploading: 'Uploading image...',
    imageCompressing: 'Compressing image...',
    imageUploadError: 'Could not upload ad image.',
    removeImage: 'Remove image',
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
    daysHint: 'days',
    prefilledHint: 'Form pre-filled from your listing. Review the details and submit.'
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
  const searchParams = useSearchParams();
  const { locale, dir, localizedPath, m } = useI18n();
  const text = labels[locale];
  const isPrefilled = useMemo(() => hasBannerAdPrefill(searchParams), [searchParams]);
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

  useEffect(() => {
    const prefill = readBannerAdPrefill(searchParams);
    if (prefill.imageUrl) setImageUrl(prefill.imageUrl);
    if (prefill.linkUrl) setLinkUrl(prefill.linkUrl);
    if (prefill.textAr) setTextAr(prefill.textAr);
    if (prefill.textEn) setTextEn(prefill.textEn);
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!imageUrl) {
      setError(text.imageUploadError);
      return;
    }

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
    <div className="site-page-shell bg-slate-50" dir={dir}>
      <UserSiteHeader />

      <main className="site-container site-page-main site-page-main--narrower min-w-0">
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
            {isPrefilled ? (
              <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-800">{text.prefilledHint}</p>
            ) : null}
            <div>
              <ImageUploader
                folder="banners"
                value={imageUrl}
                onChange={setImageUrl}
                labels={{
                  title: text.imageTitle,
                  hint: text.imageHint,
                  remove: text.removeImage,
                  uploading: text.imageUploading,
                  compressing: text.imageCompressing,
                  uploadError: text.imageUploadError
                }}
              />
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
