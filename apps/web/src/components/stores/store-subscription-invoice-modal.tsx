'use client';

import { Download, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { downloadInvoicePdf } from '@/lib/download-invoice-pdf';
import { getBillingPeriodLabel, type StoreBillingPeriod } from '@/lib/store-billing-period';
import { calculatePlanPriceWithVat, formatOmrAmount, getPlanPreVatAmount } from '@/lib/plan-pricing';
import { siteInvoiceConfig } from '@/lib/site-invoice';

export type StoreSubscriptionInvoiceData = {
  id: string;
  status: string;
  isTrial: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
  basePrice: string | number;
  discountAmount?: string | number;
  finalPrice: string | number;
  billingPeriod: StoreBillingPeriod;
  maxListings: number;
  plan?: { nameAr: string; nameEn: string };
};

type StoreSubscriptionInvoiceModalProps = {
  open: boolean;
  onClose: () => void;
  subscription: StoreSubscriptionInvoiceData | null;
  locale: 'ar' | 'en';
  userName: string;
  storeName: string;
  labels: {
    title: string;
    invoiceNumber: string;
    invoiceDate: string;
    secondPartyTitle: string;
    storeOwnerLabel: string;
    storeNameLabel: string;
    product: string;
    unitPrice: string;
    subtotal: string;
    vatTotal: string;
    grandTotal: string;
    free: string;
    maxListings: string;
    platformInfo: string;
    email: string;
    website: string;
    taxNumber: string;
    commercialRegistration: string;
    downloadPdf: string;
    downloading: string;
    close: string;
  };
};

function formatInvoiceDate(value: string | null | undefined, locale: 'ar' | 'en') {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function StoreSubscriptionInvoiceModal({
  open,
  onClose,
  subscription,
  locale,
  userName,
  storeName,
  labels
}: StoreSubscriptionInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!open || !subscription) return null;

  const planName = locale === 'en' ? subscription.plan?.nameEn : subscription.plan?.nameAr;
  const periodLabel = getBillingPeriodLabel(subscription.billingPeriod, locale);
  const productLabel = `${planName ?? '-'} · ${periodLabel} · ${subscription.maxListings} ${labels.maxListings}`;
  const baseAmount = getPlanPreVatAmount(Number(subscription.finalPrice ?? subscription.basePrice ?? 0));
  const pricing = calculatePlanPriceWithVat(baseAmount);
  const isFree = pricing.finalPrice <= 0;
  const invoiceNumber = `INV-${subscription.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = formatInvoiceDate(subscription.createdAt ?? subscription.startsAt, locale);
  const brandName = locale === 'en' ? siteInvoiceConfig.brandNameEn : siteInvoiceConfig.brandNameAr;
  const isArabic = locale === 'ar';

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);
    try {
      await downloadInvoicePdf(invoiceRef.current, `${invoiceNumber}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 font-cairo">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4">
          <h3 className="text-lg font-black text-gray-900">{labels.title}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              <Download size={16} />
              {isDownloading ? labels.downloading : labels.downloadPdf}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 transition hover:bg-gray-100"
              aria-label={labels.close}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div
            ref={invoiceRef}
            data-invoice-root
            dir={isArabic ? 'rtl' : 'ltr'}
            className="font-cairo rounded-2xl border border-gray-200 bg-white p-6 md:p-8"
            style={{ fontFamily: 'var(--font-cairo), "Cairo", sans-serif' }}
          >
            <div className="mb-8 flex flex-col gap-6 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <img src={siteInvoiceConfig.logoUrl} alt={brandName} className="h-16 w-16 object-contain" />
                <div>
                  <p className="text-2xl font-black text-slate-900">{brandName}</p>
                  <p className="mt-1 text-sm text-slate-500">{siteInvoiceConfig.website}</p>
                </div>
              </div>
              <div className="text-sm text-slate-600 sm:text-end">
                <p>
                  <span className="font-bold text-slate-800">{labels.invoiceNumber}:</span> {invoiceNumber}
                </p>
                <p className="mt-1">
                  <span className="font-bold text-slate-800">{labels.invoiceDate}:</span> {invoiceDate}
                </p>
              </div>
            </div>

            <div className="mb-8 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-800">{labels.secondPartyTitle}</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">{labels.storeOwnerLabel}</p>
                  <p className="mt-1 font-bold text-slate-900">{userName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{labels.storeNameLabel}</p>
                  <p className="mt-1 font-bold text-slate-900">{storeName}</p>
                </div>
              </div>
            </div>

            <div className="mb-6 overflow-x-auto">
              <table className="w-full min-w-[20rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 text-start font-bold">{labels.product}</th>
                    <th className="px-4 py-3 text-end font-bold">{labels.unitPrice}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-4 font-medium text-slate-900">{productLabel}</td>
                    <td className="px-4 py-4 text-end font-bold text-slate-900">
                      {isFree ? labels.free : formatOmrAmount(pricing.basePrice, locale)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mb-8 flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>{labels.subtotal}</span>
                  <span>{isFree ? labels.free : formatOmrAmount(pricing.basePrice, locale)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{labels.vatTotal}</span>
                  <span>{isFree ? labels.free : formatOmrAmount(pricing.vatAmount, locale)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black text-slate-900">
                  <span>{labels.grandTotal}</span>
                  <span>{isFree ? labels.free : formatOmrAmount(pricing.finalPrice, locale)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 text-xs leading-relaxed text-slate-500">
              <p className="mb-3 font-bold text-slate-700">{labels.platformInfo}</p>
              <p>
                {labels.email}: {siteInvoiceConfig.email}
              </p>
              <p>
                {labels.website}: {siteInvoiceConfig.website}
              </p>
              <p>
                {labels.taxNumber}: {siteInvoiceConfig.taxNumber}
              </p>
              <p>
                {labels.commercialRegistration}: {siteInvoiceConfig.commercialRegistration}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
