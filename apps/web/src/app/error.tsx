'use client';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { useI18n } from '@/lib/i18n';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { dir, locale, localizedPath } = useI18n();
  const text =
    locale === 'en'
      ? {
          title: 'Something went wrong',
          description: 'We could not load this page. Please try again, or return to the homepage.',
          retry: 'Try again',
          home: 'Back to home'
        }
      : {
          title: 'حدث خطأ غير متوقع',
          description: 'تعذر تحميل هذه الصفحة. حاول مرة أخرى أو ارجع إلى الصفحة الرئيسية.',
          retry: 'حاول مرة أخرى',
          home: 'العودة للرئيسية'
        };

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10" dir={dir}>
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-100 md:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600">
            <AlertTriangle size={40} />
          </div>

          <h1 className="text-3xl font-black text-slate-900 md:text-5xl">{text.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 md:text-lg">{text.description}</p>

          {error.digest ? (
            <p className="mx-auto mt-5 w-fit rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500" dir="ltr">
              Error ID: {error.digest}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700"
            >
              <RefreshCw size={18} />
              {text.retry}
            </button>
            <Link href={localizedPath('/')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50">
              <Home size={18} />
              {text.home}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
