'use client';

import { Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

import { resolveMediaUrl } from '@/lib/media-url';

type ListingStoreChipProps = {
  name: string;
  slug: string;
  logoUrl?: string | null;
  storeHref: string;
  className?: string;
};

export function ListingStoreChip({ name, slug, logoUrl, storeHref, className = '' }: ListingStoreChipProps) {
  const router = useRouter();
  const logoSrc = resolveMediaUrl(logoUrl);

  const openStore = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    router.push(storeHref);
  };

  return (
    <button
      type="button"
      onClick={openStore}
      aria-label={slug}
      className={`inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-start transition hover:bg-slate-200 ${className}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-600 to-teal-600 text-white">
        {logoSrc ? <img src={logoSrc} alt="" className="h-full w-full object-cover" /> : <Store size={14} />}
      </span>
      <span className="truncate text-xs font-bold text-slate-800">{name}</span>
    </button>
  );
}
