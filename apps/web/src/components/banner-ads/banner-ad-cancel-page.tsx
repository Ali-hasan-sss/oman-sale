'use client';

import Link from 'next/link';

import { useI18n } from '@/lib/i18n';

const labels = {
  ar: {
    title: 'تم إلغاء الدفع',
    subtitle: 'لم يتم إكمال الدفع. يمكنك المحاولة مرة أخرى في أي وقت.',
    retry: 'إعادة المحاولة',
    home: 'العودة للرئيسية'
  },
  en: {
    title: 'Payment cancelled',
    subtitle: 'Payment was not completed. You can try again at any time.',
    retry: 'Try again',
    home: 'Back to home'
  }
} as const;

export function BannerAdCancelPage() {
  const { locale, localizedPath } = useI18n();
  const text = labels[locale];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-3xl font-black text-slate-900">{text.title}</h1>
        <p className="mb-6 text-gray-600">{text.subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={localizedPath('/banner-ad')} className="rounded-lg bg-brand-600 px-5 py-3 font-bold text-white">
            {text.retry}
          </Link>
          <Link href={localizedPath('/')} className="rounded-lg border border-gray-300 px-5 py-3 font-bold">
            {text.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
