'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useI18n } from '@/lib/i18n';

const labels = {
  ar: {
    title: 'تم إلغاء الدفع',
    subtitle: 'لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى من صفحة المتجر.',
    myStore: 'العودة لمتجري'
  },
  en: {
    title: 'Payment cancelled',
    subtitle: 'Payment was not completed. You can try again from your store page.',
    myStore: 'Back to my store'
  }
} as const;

export default function StorePaymentCancelRoutePage() {
  const router = useRouter();
  const { locale, localizedPath } = useI18n();
  const text = labels[locale];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-3xl font-black text-gray-900">{text.title}</h1>
        <p className="mb-6 text-gray-600">{text.subtitle}</p>
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
