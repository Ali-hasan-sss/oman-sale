'use client';

import { Globe, Search } from 'lucide-react';
import Link from 'next/link';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { useI18n } from '@/lib/i18n';

export function TourismHeader() {
  const { dir, localizedPath, m, toggleLocale } = useI18n();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href={localizedPath('/')}>
            <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
          </Link>

          <MobileNavMenu />
          <div className="hidden items-center gap-4 lg:flex">
            <button
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition hover:bg-gray-50"
              onClick={toggleLocale}
              type="button"
            >
              <Globe size={18} />
              <span className="text-sm">{m.common.languageSwitch}</span>
            </button>
            <ChatNavLink className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
            <Link className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" href={localizedPath('/all-listings')}>
              {m.common.allListings}
            </Link>
            <Link className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" href={localizedPath('/my-listings')}>
              {m.common.myListings}
            </Link>
            <Link className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700" href={localizedPath('/add-listing')}>
              {m.common.addListing}
            </Link>
            <HeaderAuthAction loginClassName="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
          </div>
        </div>

        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
          <input
            type="text"
            placeholder={m.home.searchPlaceholder}
            className={`w-full rounded-lg border border-gray-300 py-3 outline-none focus:ring-2 focus:ring-green-500 ${
              dir === 'rtl' ? 'pl-4 pr-12' : 'pl-12 pr-4'
            }`}
          />
        </div>
      </div>
    </header>
  );
}
