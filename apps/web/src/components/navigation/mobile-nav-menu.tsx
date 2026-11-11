'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { HeaderCustomNavButtons } from '@/components/navigation/header-custom-nav-buttons';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useI18n } from '@/lib/i18n';

type MobileNavMenuProps = {
  variant?: 'light' | 'hero';
};

const DRAWER_MS = 320;

export function MobileNavMenu({ variant = 'light' }: MobileNavMenuProps) {
  const { dir, localizedPath, m } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [shown, setShown] = useState(false);
  const buttonClass =
    variant === 'hero'
      ? 'vx-navbtn flex h-11 w-11 items-center justify-center'
      : 'flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 bg-white transition hover:bg-gray-50';
  const loginClass =
    variant === 'hero'
      ? 'vx-navbtn px-3 py-2 text-sm'
      : 'rounded-lg border border-gray-300 px-3 py-2 text-sm transition hover:bg-gray-50';
  const fromEdge = dir === 'rtl' ? '-translate-x-[calc(100%+1.25rem)]' : 'translate-x-[calc(100%+1.25rem)]';

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      let cancelled = false;
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setShown(true);
        });
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }

    setShown(false);
    const timer = window.setTimeout(() => setRendered(false), DRAWER_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  return (
    <div className="flex items-center gap-2 md:hidden">
      <NotificationBell variant={variant === 'hero' ? 'hero' : 'default'} />
      <HeaderAuthAction loginClassName={loginClass} />
      <button aria-label="Open navigation" className={buttonClass} onClick={() => setIsOpen(true)} type="button">
        <Menu size={22} />
      </button>

      {rendered ? (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 motion-reduce:transition-none ${
              shown ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setIsOpen(false)}
            type="button"
            aria-label="Close navigation"
          />
          <aside
            className={`absolute bottom-4 top-4 flex w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-black/5 transition-transform duration-300 ease-out motion-reduce:transition-none ${
              dir === 'rtl' ? 'left-4' : 'right-4'
            } ${shown ? 'translate-x-0' : fromEdge}`}
          >
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <Link href={localizedPath('/')} onClick={() => setIsOpen(false)} className="flex items-center">
                <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
              </Link>
              <button className="rounded-xl p-2 transition hover:bg-gray-100" onClick={() => setIsOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>

            <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-4">
              <MobileLink href="/stores" label={m.common.browseStores} onClick={() => setIsOpen(false)} />
              <HeaderCustomNavButtons
                onNavigate={() => setIsOpen(false)}
                className="space-y-2"
                linkClassName="block rounded-xl px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
              />
              <MobileLink href="/news" label={m.common.news} onClick={() => setIsOpen(false)} />
              <MobileLink href="/pricing" label={m.common.pricing} onClick={() => setIsOpen(false)} />
              <MobileLink href="/all-listings" label={m.common.allListings} onClick={() => setIsOpen(false)} />
              <MobileLink href="/favorites" label={m.common.favorites} onClick={() => setIsOpen(false)} />
              <MobileLink href="/notifications" label={m.common.notifications} onClick={() => setIsOpen(false)} />
              <MobileLink href="/terms" label={m.footer.terms} onClick={() => setIsOpen(false)} />
              <MobileLink href="/privacy" label={m.footer.privacy} onClick={() => setIsOpen(false)} />
              <MobileLink href="/refund-policy" label={m.footer.refundPolicy} onClick={() => setIsOpen(false)} />
              <MobileLink href="/profile" label={m.common.profile} onClick={() => setIsOpen(false)} />
              <Link
                href={localizedPath('/add-listing')}
                onClick={() => setIsOpen(false)}
                className="btn-quick-sell mt-4 block rounded-xl px-4 py-3 text-center font-bold transition"
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
