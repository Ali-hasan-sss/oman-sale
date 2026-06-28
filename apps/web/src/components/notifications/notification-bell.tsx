'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { AUTH_CHANGED_EVENT } from '@/components/auth/user-menu';
import { hasNotificationSession } from '@/lib/notification-session';
import { useI18n } from '@/lib/i18n';
import { registerWebPush, resetWebPushRegistration } from '@/lib/web-push';
import { useNotificationRealtimeStore } from '@/store/notification-realtime-store';

type NotificationBellProps = {
  variant?: 'default' | 'hero' | 'admin';
  className?: string;
  showViewAllLink?: boolean;
};

export function NotificationBell({
  variant = 'default',
  className = '',
  showViewAllLink = true
}: NotificationBellProps) {
  const { locale, localizedPath, m } = useI18n();
  const connect = useNotificationRealtimeStore((state) => state.connect);
  const reset = useNotificationRealtimeStore((state) => state.reset);
  const refresh = useNotificationRealtimeStore((state) => state.refresh);
  const markRead = useNotificationRealtimeStore((state) => state.markRead);
  const markAllRead = useNotificationRealtimeStore((state) => state.markAllRead);
  const unreadCount = useNotificationRealtimeStore((state) => state.unreadCount);
  const items = useNotificationRealtimeStore((state) => state.items);
  const [isOpen, setIsOpen] = useState(false);
  const [canNotify, setCanNotify] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 360
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  const positionPanel = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const isRtl = document.documentElement.dir === 'rtl';
    const viewportWidth = window.innerWidth;
    const width = Math.min(384, viewportWidth - 24);
    const gap = 12;

    let left = isRtl ? rect.right - width : rect.left;
    left = Math.max(12, Math.min(left, viewportWidth - width - 12));

    setPanelStyle({ top: rect.bottom + gap, left, width });
  }, []);

  const syncSession = useCallback(() => {
    const active = hasNotificationSession();
    setCanNotify(active);
    if (!active) {
      reset();
      resetWebPushRegistration();
      return;
    }
    reset();
    connect();
    void registerWebPush(() => {
      void refresh();
    });
  }, [connect, reset, refresh]);

  useEffect(() => {
    syncSession();
    window.addEventListener(AUTH_CHANGED_EVENT, syncSession);
    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, [syncSession]);

  useEffect(() => {
    if (!isOpen || !canNotify) return;

    void refresh();

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || containerRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isOpen, refresh, canNotify]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    positionPanel();
    window.addEventListener('resize', positionPanel);
    window.addEventListener('scroll', positionPanel, true);
    return () => {
      window.removeEventListener('resize', positionPanel);
      window.removeEventListener('scroll', positionPanel, true);
    };
  }, [isOpen, positionPanel]);

  if (!canNotify) return null;

  const buttonClass =
    variant === 'hero'
      ? 'relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-brand-700 shadow-lg transition hover:bg-white'
      : variant === 'admin'
        ? 'relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50'
        : 'relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50';

  const localizedText = (item: (typeof items)[number]) => {
    const metadata = item.metadata as { titleEn?: string; bodyEn?: string } | null | undefined;
    if (locale === 'en' && metadata?.titleEn && metadata?.bodyEn) {
      return { title: metadata.titleEn, body: metadata.bodyEn };
    }
    return { title: item.title, body: item.body };
  };

  const panel = (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: panelStyle.top,
        left: panelStyle.left,
        width: panelStyle.width
      }}
      className="z-[2000] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <p className="font-bold text-gray-900">{m.common.notifications}</p>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            {m.common.markAllRead}
          </button>
        ) : null}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">{m.common.noNotifications}</p>
        ) : (
          items.slice(0, 12).map((item) => {
            const text = localizedText(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!item.isRead) void markRead(item.id);
                }}
                className={`block w-full border-b border-gray-50 px-4 py-3 text-start transition hover:bg-gray-50 ${
                  item.isRead ? 'bg-white' : 'bg-brand-50/40'
                }`}
              >
                <p className="line-clamp-1 text-sm font-bold text-gray-900">{text.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600">{text.body}</p>
                <p className="mt-1 text-[10px] text-gray-400">
                  {new Date(item.createdAt).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
                </p>
              </button>
            );
          })
        )}
      </div>

      {showViewAllLink ? (
        <Link
          href={localizedPath('/notifications')}
          onClick={() => setIsOpen(false)}
          className="block border-t border-gray-100 px-4 py-3 text-center text-sm font-semibold text-brand-600 hover:bg-gray-50"
        >
          {m.common.viewAllNotifications}
        </Link>
      ) : null}
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={buttonClass}
        aria-label={m.common.notifications}
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen && mounted ? createPortal(panel, document.body) : null}
    </div>
  );
}
