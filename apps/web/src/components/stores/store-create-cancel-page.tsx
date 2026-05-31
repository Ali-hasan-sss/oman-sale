'use client';

import Link from 'next/link';

import { useI18n } from '@/lib/i18n';

const labels = {
  ar: {
    title: 'تم إلغاء الدفع',
    subtitle: 'لم يكتمل إنشاء المتجر. يمكنك المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
    home: 'الرئيسية'
  },
  en: {
    title: 'Payment cancelled',
    subtitle: 'Store creation was not completed. You can try again.',
    retry: 'Try again',
    home: 'Home'
  }
} as const;

export function StoreCreateCancelPage() {
  const { locale, localizedPath } = useI18n();
  const text = labels[locale];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-3xl font-black text-amber-700">{text.title}</h1>
        <p className="mb-6 text-gray-600">{text.subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={localizedPath('/stores/create')} className="rounded-lg bg-green-600 px-5 py-3 font-bold text-white">
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
