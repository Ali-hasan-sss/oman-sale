'use client';

import { Globe } from 'lucide-react';
import Link from 'next/link';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { BrowseStoresNavButton } from '@/components/navigation/browse-stores-nav-button';
import { HeaderCustomNavButtons } from '@/components/navigation/header-custom-nav-buttons';
import { useI18n } from '@/lib/i18n';

type UserSiteHeaderNavProps = {
  variant?: 'default' | 'hero';
};

export function UserSiteHeaderNav({ variant = 'default' }: UserSiteHeaderNavProps) {
  const { localizedPath, m, toggleLocale } = useI18n();

  const outline =
    variant === 'hero'
      ? 'whitespace-nowrap rounded-lg border border-white/70 bg-white/90 px-2 py-1.5 text-xs font-medium shadow-lg transition hover:bg-white sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm'
      : 'whitespace-nowrap rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium transition hover:bg-gray-50 sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm';

  const primary =
    variant === 'hero'
      ? 'whitespace-nowrap rounded-lg bg-brand-600 px-2 py-1.5 text-xs font-bold text-white shadow-lg transition hover:bg-brand-700 sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm'
      : 'whitespace-nowrap rounded-lg bg-green-600 px-2 py-1.5 text-xs font-bold text-white transition hover:bg-green-700 sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm';

  return (
    <nav className="hidden min-w-0 md:flex md:flex-1 md:items-center md:justify-end md:gap-1.5 lg:gap-2 xl:gap-3">
      <button type="button" onClick={toggleLocale} className={`inline-flex items-center gap-1.5 ${outline}`}>
        <Globe size={16} className="shrink-0 lg:hidden" />
        <Globe size={18} className="hidden shrink-0 lg:block" />
        <span className="hidden xl:inline">{m.common.languageSwitch}</span>
      </button>
      <BrowseStoresNavButton variant={variant === 'hero' ? 'hero' : 'default'} compact />
      <HeaderCustomNavButtons variant={variant === 'hero' ? 'hero' : 'default'} className="flex items-center gap-1.5 lg:gap-2" />
      <Link href={localizedPath('/news')} className={outline}>
        {m.common.news}
      </Link>
      <Link href={localizedPath('/pricing')} className={outline}>
        {m.common.pricing}
      </Link>
      <Link href={localizedPath('/all-listings')} className={outline}>
        {m.common.allListings}
      </Link>
      <Link href={localizedPath('/add-listing')} className={primary}>
        {m.common.addListing}
      </Link>
      <HeaderAuthAction loginClassName={outline} />
    </nav>
  );
}
