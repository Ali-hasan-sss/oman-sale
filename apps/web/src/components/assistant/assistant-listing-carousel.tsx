'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { AssistantListingCard } from '@/hooks/use-assistant-chat';
import { useI18n } from '@/lib/i18n';

type AssistantListingCarouselProps = {
  listings: AssistantListingCard[];
};

const placeholderImage = '/logo.png';

function formatPrice(price: number | null, currency: string, locale: string) {
  if (price === null) return locale === 'ar' ? 'اتفاق' : 'Negotiable';
  return `${price.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-OM')} ${currency}`;
}

export function AssistantListingCarousel({ listings }: AssistantListingCarouselProps) {
  const { locale, localizedPath, m } = useI18n();

  if (listings.length === 0) return null;

  return (
    <div className="assistant-scrollbar-none -mx-0.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-1">
      {listings.map((listing) => (
        <article
          key={listing.id}
          className="flex w-[152px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white shadow-sm"
        >
          <div className="relative aspect-[3/4] w-full bg-[#F5F5F5]">
            <Image
              src={listing.imageUrl || placeholderImage}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="152px"
            />
            {listing.isFeatured ? (
              <span className="absolute left-2 top-2 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {listing.badgeLabel || m.common.featured}
              </span>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col p-2.5">
            <h4 className="line-clamp-2 text-sm font-semibold text-brand-700">{listing.title}</h4>
            <p className="mt-1 text-[11px] font-bold text-ink-900">
              {formatPrice(listing.price, listing.currency, locale)}
            </p>
            <ul className="mt-2 flex-1 space-y-1 text-[11px] leading-snug text-[#6B6B6B]">
              <li className="flex gap-1.5">
                <span className="shrink-0 text-[#B0B0B0]">•</span>
                <span>{listing.city}{listing.area ? ` · ${listing.area}` : ''}</span>
              </li>
              {listing.categoryName ? (
                <li className="flex gap-1.5">
                  <span className="shrink-0 text-[#B0B0B0]">•</span>
                  <span>{listing.categoryName}</span>
                </li>
              ) : null}
            </ul>
            <Link
              href={localizedPath(`/listing/${listing.id}`)}
              className="mt-3 block rounded-lg bg-brand-600 py-2 text-center text-[11px] font-medium text-white transition-opacity hover:opacity-90"
            >
              {locale === 'ar' ? 'عرض' : 'View'}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
