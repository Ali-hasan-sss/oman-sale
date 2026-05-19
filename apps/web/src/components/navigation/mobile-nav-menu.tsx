'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { useI18n } from '@/lib/i18n';

type MobileNavMenuProps = {
  variant?: 'light' | 'hero';
};

export function MobileNavMenu({ variant = 'light' }: MobileNavMenuProps) {
  const { dir, localizedPath, m } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const buttonClass =
    variant === 'hero'
      ? 'flex h-11 w-11 items-center justify-center rounded-xl border border-white/70 bg-white/90 shadow-lg transition hover:bg-white'
      : 'flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 bg-white transition hover:bg-gray-50';
  const loginClass =
    variant === 'hero'
      ? 'rounded-lg border border-white/70 bg-white/90 px-3 py-2 text-sm shadow-lg transition hover:bg-white'
      : 'rounded-lg border border-gray-300 px-3 py-2 text-sm transition hover:bg-gray-50';

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <HeaderAuthAction loginClassName={loginClass} />
      <button aria-label="Open navigation" className={buttonClass} onClick={() => setIsOpen(true)} type="button">
        <Menu size={22} />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} type="button" aria-label="Close navigation" />
          <aside
            className={`absolute top-0 h-full w-80 max-w-[85vw] bg-white p-5 shadow-2xl ${
              dir === 'rtl' ? 'right-0' : 'left-0'
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
              <Link href={localizedPath('/')} onClick={() => setIsOpen(false)} className="flex items-center gap-3">
                <img src="/logo.png" alt="Oman Sale" className="h-12 w-auto" />
                <span className="font-black text-gray-900">Oman Sale</span>
              </Link>
              <button className="rounded-xl p-2 transition hover:bg-gray-100" onClick={() => setIsOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>

            <nav className="space-y-2">
              <MobileLink href="/all-listings" label={m.common.allListings} onClick={() => setIsOpen(false)} />
              <div onClick={() => setIsOpen(false)}>
                <ChatNavLink className="block rounded-xl px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-50" />
              </div>
              <MobileLink href="/my-listings" label={m.common.myListings} onClick={() => setIsOpen(false)} />
              <MobileLink href="/favorites" label={m.common.favorites} onClick={() => setIsOpen(false)} />
              <MobileLink href="/profile" label={m.common.profile} onClick={() => setIsOpen(false)} />
              <Link
                href={localizedPath('/add-listing')}
                onClick={() => setIsOpen(false)}
                className="mt-4 block rounded-xl bg-green-600 px-4 py-3 text-center font-bold text-white transition hover:bg-green-700"
              >
                {m.common.addListing}
              </Link>
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function MobileLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  const { localizedPath } = useI18n();

  return (
    <Link href={localizedPath(href)} onClick={onClick} className="block rounded-xl px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-50">
      {label}
    </Link>
  );
}
