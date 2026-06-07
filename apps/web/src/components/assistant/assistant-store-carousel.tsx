'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Store } from 'lucide-react';

import type { AssistantStoreCard } from '@/hooks/use-assistant-chat';
import { useI18n } from '@/lib/i18n';
import { getCityLabel } from '@/lib/oman-cities';

type AssistantStoreCarouselProps = {
  stores: AssistantStoreCard[];
};

const placeholderImage = '/logo.png';

export function AssistantStoreCarousel({ stores }: AssistantStoreCarouselProps) {
  const { locale, localizedPath, m } = useI18n();
  const t = m.assistant;

  if (stores.length === 0) return null;

  return (
    <div className="assistant-scrollbar-none -mx-0.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-1">
      {stores.map((store) => (
        <article
          key={store.id}
          className="flex w-[168px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white shadow-sm"
        >
          <div className="relative aspect-[4/3] w-full bg-[#F5F5F5]">
            <Image
              src={store.coverUrl || store.logoUrl || placeholderImage}
              alt={store.name}
              fill
              className="object-cover"
              sizes="168px"
            />
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt=""
                className="absolute bottom-2 start-2 h-8 w-8 rounded-lg border border-white bg-white object-cover shadow"
              />
            ) : null}
          </div>
          <div className="flex flex-1 flex-col p-2.5">
            <h4 className="line-clamp-2 text-sm font-semibold text-brand-700">{store.name}</h4>
            {store.storeTypeName ? (
              <span className="mt-1 inline-flex w-fit rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                {store.storeTypeName}
              </span>
            ) : null}
            <ul className="mt-2 flex-1 space-y-1 text-[11px] leading-snug text-[#6B6B6B]">
              {store.city ? (
                <li className="flex gap-1.5">
                  <span className="shrink-0 text-[#B0B0B0]">•</span>
                  <span>{getCityLabel(store.city, locale)}</span>
                </li>
              ) : null}
              <li className="flex gap-1.5">
                <span className="shrink-0 text-[#B0B0B0]">•</span>
                <span className="inline-flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  {store.listingsCount} {m.storesBrowse.listings}
                </span>
              </li>
            </ul>
            <Link
              href={localizedPath(`/stores/${store.slug}`)}
              className="mt-3 block rounded-lg bg-brand-600 py-2 text-center text-[11px] font-medium text-white transition-opacity hover:opacity-90"
            >
              {t.viewStore}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
