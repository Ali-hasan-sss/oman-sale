'use client';

import { ArrowLeft, Home, Search } from 'lucide-react';
import Link from 'next/link';

import { useI18n } from '@/lib/i18n';

export default function NotFoundPage() {
  const { dir, locale, localizedPath } = useI18n();
  const text =
    locale === 'en'
      ? {
          eyebrow: '404',
          title: 'This page is not available',
          description: 'The page may have been moved, deleted, or the link you used is incorrect.',
          home: 'Back to home',
          listings: 'Browse all listings'
        }
      : {
          eyebrow: '404',
          title: 'الصفحة غير موجودة',
          description: 'ربما تم نقل الصفحة أو حذفها، أو أن الرابط الذي استخدمته غير صحيح.',
          home: 'العودة للرئيسية',
          listings: 'تصفح جميع العروض'
        };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10" dir={dir}>
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <section className="relative w-full overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-100 md:p-12">
          <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-brand-100 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-desert-100 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <Link href={localizedPath('/')} className="mx-auto mb-8 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <img src="/logo.png" alt="Oman Sale" className="h-full w-full object-contain p-2" />
            </Link>

            <p className="mb-3 text-7xl font-black text-brand-600 md:text-8xl">{text.eyebrow}</p>
            <h1 className="text-3xl font-black text-slate-900 md:text-5xl">{text.title}</h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 md:text-lg">{text.description}</p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={localizedPath('/')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700">
                <Home size={18} />
                {text.home}
              </Link>
              <Link href={localizedPath('/all-listings')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50">
                <Search size={18} />
                {text.listings}
              </Link>
            </div>

            <Link href={localizedPath('/')} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-600">
              <ArrowLeft size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
              Oman Sale
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
