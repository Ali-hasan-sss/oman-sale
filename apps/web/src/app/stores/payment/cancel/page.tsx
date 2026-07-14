'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

import { useI18n } from '@/lib/i18n';
import { useThawaniPaymentCancel } from '@/lib/use-thawani-payment-cancel';

const labels = {
  ar: {
    title: 'تم إلغاء الدفع',
    subtitle: 'لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى من صفحة المتجر.',
    processing: 'جاري إلغاء العملية...',
    myStore: 'العودة لمتجري'
  },
  en: {
    title: 'Payment cancelled',
    subtitle: 'Payment was not completed. You can try again from your store page.',
    processing: 'Cancelling checkout...',
    myStore: 'Back to my store'
  }
} as const;

function StorePaymentCancelContent() {
  const router = useRouter();
  const { locale, localizedPath } = useI18n();
  const text = labels[locale];
  const { isProcessing } = useThawaniPaymentCancel({
    cancelEndpoint: '/stores/payments/thawani/cancel',
    loginPath: localizedPath('/login')
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-3xl font-black text-gray-900">{text.title}</h1>
        <p className="mb-6 text-gray-600">{isProcessing ? text.processing : text.subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push(localizedPath('/my-store'))}
            className="rounded-lg bg-green-600 px-5 py-3 font-bold text-white"
          >
            {text.myStore}
          </button>
          <Link href={localizedPath('/')} className="rounded-lg border border-gray-300 px-5 py-3 font-bold">
            {locale === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StorePaymentCancelRoutePage() {
  return (
    <Suspense fallback={null}>
      <StorePaymentCancelContent />
    </Suspense>
  );
}
