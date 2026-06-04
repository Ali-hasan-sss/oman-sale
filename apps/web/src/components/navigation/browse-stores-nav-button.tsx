'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type StoreType = {
  id: string;
  nameAr: string;
  nameEn: string;
};

type BrowseStoresNavButtonProps = {
  variant?: 'default' | 'hero';
  label?: string;
  compact?: boolean;
};

export function BrowseStoresNavButton({ variant = 'default', label, compact = false }: BrowseStoresNavButtonProps) {
  const { locale, dir, localizedPath, m } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [typesLoaded, setTypesLoaded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const buttonLabel = label ?? m.common.browseStores;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || typesLoaded) return;

    api
      .get<{ data: StoreType[] }>('/store-types')
      .then((response) => setStoreTypes(response.data.data))
      .catch(() => setStoreTypes([]))
      .finally(() => setTypesLoaded(true));
  }, [isOpen, typesLoaded]);

  const updateMenuPosition = () => {
    const wrap = wrapRef.current;
    const menu = menuRef.current;
    if (!wrap || !menu) return;

    const rect = wrap.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const gap = 6;
    const edgePadding = 8;

    let left = rect.left;
    left = Math.max(edgePadding, Math.min(left, window.innerWidth - menuRect.width - edgePadding));

    let top = rect.bottom + gap;
    if (top + menuRect.height > window.innerHeight - edgePadding) {
      top = Math.max(edgePadding, rect.top - gap - menuRect.height);
    }

    setMenuPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
  }, [isOpen, storeTypes.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleReposition = () => updateMenuPosition();

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen]);

  const sizeClass = compact ? 'px-2 py-1.5 text-xs sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm' : 'px-4 py-2 text-sm';

  const wrapClass =
    variant === 'hero'
      ? `inline-flex max-w-full items-stretch overflow-hidden rounded-lg border border-white/70 bg-white/90 shadow-lg ${compact ? 'min-w-0' : ''}`
      : `inline-flex max-w-full items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white ${compact ? 'min-w-0' : ''}`;

  const linkClass =
    variant === 'hero'
      ? `${sizeClass} truncate font-medium transition hover:bg-white`
      : `${sizeClass} truncate font-medium transition hover:bg-gray-50`;

  const toggleClass =
    variant === 'hero'
      ? `shrink-0 border-s border-white/70 px-1.5 py-1.5 transition hover:bg-white sm:px-2 sm:py-2`
      : `shrink-0 border-s border-gray-300 px-1.5 py-1.5 transition hover:bg-gray-50 sm:px-2 sm:py-2`;

  const menu =
    isOpen && mounted ? (
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: menuPosition?.top ?? -9999,
          left: menuPosition?.left ?? -9999,
          visibility: menuPosition ? 'visible' : 'hidden'
        }}
        className="z-[200] max-h-72 min-w-[220px] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        dir={dir}
      >
        {!typesLoaded ? (
          <p className="px-4 py-3 text-sm text-slate-500">{m.admin.loading}</p>
        ) : storeTypes.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">{m.storesBrowse.empty}</p>
        ) : (
          storeTypes.map((storeType) => (
            <Link
              key={storeType.id}
              href={localizedPath(`/stores?storeTypeId=${encodeURIComponent(storeType.id)}`)}
              className="block px-4 py-2.5 text-start text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              onClick={() => setIsOpen(false)}
            >
              {locale === 'en' ? storeType.nameEn : storeType.nameAr}
            </Link>
          ))
        )}
      </div>
    ) : null;

  return (
    <>
      <div ref={wrapRef} className={wrapClass} dir={dir}>
        <Link href={localizedPath('/stores')} className={linkClass}>
          {buttonLabel}
        </Link>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={m.common.browseStoresByType}
          className={toggleClass}
          onClick={() => setIsOpen((current) => !current)}
        >
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
