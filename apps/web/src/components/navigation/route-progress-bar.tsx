'use client';

import { usePathname } from 'next/navigation';
import { MouseEvent, useEffect, useRef, useState } from 'react';

const isModifiedClick = (event: MouseEvent | globalThis.MouseEvent) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

export function RouteProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<number | undefined>();

  const clearTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  };

  const start = () => {
    clearTimer();
    setVisible(true);
    setProgress(18);

    timeoutRef.current = window.setTimeout(() => {
      setProgress(72);
    }, 120);
  };

  const finish = () => {
    clearTimer();
    setProgress(100);

    timeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  };

  useEffect(() => {
    const handleClick = (event: globalThis.MouseEvent) => {
      if (isModifiedClick(event)) return;

      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const target = anchor.getAttribute('target');
      if (!href || href.startsWith('#') || target === '_blank' || anchor.hasAttribute('download')) return;

      const nextUrl = new URL(href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.origin !== currentUrl.origin) return;
      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return;

      start();
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      clearTimer();
    };
  }, []);

  useEffect(() => {
    if (visible) finish();
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-1 overflow-hidden bg-transparent">
      <div
        className="h-full rounded-e-full bg-gradient-to-r from-brand-500 via-emerald-500 to-desert-500 shadow-[0_0_12px_rgba(16,185,129,0.55)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
