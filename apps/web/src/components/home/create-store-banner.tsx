'use client';

import { Store } from 'lucide-react';
import Link from 'next/link';

import { useI18n } from '@/lib/i18n';

export function CreateStoreBanner() {
  const { localizedPath, m } = useI18n();

  return (
    <section className="mx-auto max-w-7xl px-4 pb-2 pt-8">
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-gradient-to-br from-emerald-600 to-green-700 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Store size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black">{m.home.createStoreTitle}</h2>
            <p className="mt-1 max-w-2xl text-sm text-emerald-50">{m.home.createStoreSubtitle}</p>
          </div>
        </div>
        <Link
          href={localizedPath('/stores/create')}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 font-bold text-green-700 transition hover:bg-emerald-50"
        >
          {m.common.createStore}
        </Link>
      </div>
    </section>
  );
}
