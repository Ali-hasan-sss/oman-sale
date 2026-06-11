'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const STORAGE_PREFIX = 'oman-sale-scroll:';

function stripLocalePrefix(pathname: string) {
  return pathname.replace(/^\/(ar|en)(?=\/|$)/, '') || '/';
}

function isHomePath(pathname: string) {
  const path = stripLocalePrefix(pathname);
  return path === '/';
}

function restoreScrollPosition(targetY: number) {
  let attempts = 0;
  const maxAttempts = 60;

  const tryRestore = () => {
    window.scrollTo(0, targetY);
    attempts += 1;

    const notEnoughHeight = document.documentElement.scrollHeight < targetY + window.innerHeight * 0.4;
    const notAtTarget = Math.abs(window.scrollY - targetY) > 12;

    if (attempts < maxAttempts && (notEnoughHeight || notAtTarget)) {
      requestAnimationFrame(tryRestore);
    }
  };

  requestAnimationFrame(tryRestore);
}

export function useScrollRestoration(enabled = true) {
  const pathname = usePathname();
  const storageKey = `${STORAGE_PREFIX}${pathname}`;
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isHomePath(pathname) || restoredRef.current) return;

    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;

    const targetY = Number(saved);
    if (!Number.isFinite(targetY) || targetY <= 0) return;

    restoredRef.current = true;
    restoreScrollPosition(targetY);
  }, [enabled, pathname, storageKey]);

  useEffect(() => {
    if (!enabled || !isHomePath(pathname)) return;

    let saveTimer: ReturnType<typeof setTimeout> | undefined;

    const savePosition = () => {
      sessionStorage.setItem(storageKey, String(window.scrollY));
    };

    const onScroll = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(savePosition, 120);
    };

    const onBeforeUnload = () => savePosition();
    const onPageHide = () => savePosition();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      if (saveTimer) clearTimeout(saveTimer);
      savePosition();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [enabled, pathname, storageKey]);
}
