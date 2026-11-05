'use client';

import { MapPin } from 'lucide-react';
import Link from 'next/link';

export type LandmarkItem = {
  id: string;
  image: string;
  title: string;
  place?: string;
  description?: string;
};

type LandmarksHeaderProps = {
  count: number;
  locale: string;
  subtitle?: string;
  tripsHref?: string;
  as?: 'h1' | 'h2';
};

/** "🇴🇲 10 معالم سياحية تستحق الزيارة في عُمان" with the trips link on the opposite side. */
export function LandmarksHeader({ count, locale, subtitle, tripsHref, as = 'h2' }: LandmarksHeaderProps) {
  const isAr = locale !== 'en';
  const Heading = as;
  const title = isAr
    ? `${count} ${count >= 3 && count <= 10 ? 'معالم' : 'معلماً'} تستحق الزيارة في عُمان`
    : `${count} landmarks worth visiting in Oman`;

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <Heading className="flex items-center gap-3 text-2xl font-black text-ink-900 sm:text-3xl">
          <OmanFlag />
          <span>{title}</span>
        </Heading>
        {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {tripsHref ? (
        <Link
          href={tripsHref}
          className="mt-2 shrink-0 text-sm font-black text-brand-700 underline decoration-2 underline-offset-4 transition hover:text-brick-500"
        >
          {isAr ? 'رحلات سياحية لهذه الأماكن' : 'Tours to these places'}
        </Link>
      ) : null}
    </div>
  );
}

export function LandmarkGrid({
  items,
  locale,
  hrefFor
}: {
  items: LandmarkItem[];
  locale: string;
  hrefFor: (item: LandmarkItem) => string;
}) {
  const isAr = locale !== 'en';
  const cta = isAr ? 'الصور والطقس ووقت الزيارة' : 'Photos, weather & best time';

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {items.map((item, index) => (
        <Link
          key={item.id}
          href={hrefFor(item)}
          className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-[0_24px_44px_-26px_rgba(15,23,42,0.5)]"
        >
          <div className="relative h-36 overflow-hidden bg-gradient-to-br from-brand-100 to-slate-200">
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden';
              }}
            />
            <span className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/85 text-sm font-black text-white ring-2 ring-white/70 backdrop-blur-sm">
              {(index + 1).toLocaleString('en-US')}
            </span>
          </div>

          <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
            <h3 className="line-clamp-2 text-base font-black leading-snug text-ink-900">{item.title}</h3>
            {item.place ? (
              <p className="mt-1.5 flex items-center gap-1 text-sm font-bold text-brand-700">
                <MapPin size={14} className="shrink-0" />
                <span className="line-clamp-1">{item.place}</span>
              </p>
            ) : null}
            {item.description ? (
              <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-slate-600">{item.description}</p>
            ) : null}
            <span className="mt-auto pt-3 text-[13px] font-black text-brick-500 underline-offset-4 group-hover:underline">
              {cta}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Flag of Oman as a small inline SVG (emoji flags do not render on Windows). */
function OmanFlag() {
  return (
    <svg viewBox="0 0 30 20" className="h-7 w-10 shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-black/10" aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#008000" />
      <rect y="6.67" width="30" height="6.67" fill="#db161b" />
      <rect width="8" height="20" fill="#db161b" />
      <g fill="#fff" transform="translate(4 4.2) scale(0.32)">
        <path d="M-4.5-6.5l9 13M4.5-6.5l-9 13" stroke="#fff" strokeWidth="2" />
        <path d="M-1.5-9h3v8h-3z" />
        <circle r="2.6" />
      </g>
    </svg>
  );
}
