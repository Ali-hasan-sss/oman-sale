'use client';

import { useEffect, useState } from 'react';

import { AUTH_CHANGED_EVENT } from '@/components/auth/user-menu';
import { UserSiteHeader } from '@/components/navigation/user-site-header';
import { hasNotificationSession } from '@/lib/notification-session';
import { useI18n } from '@/lib/i18n';
import { useNotificationRealtimeStore } from '@/store/notification-realtime-store';

export default function NotificationsPage() {
  const { locale, m } = useI18n();
  const connect = useNotificationRealtimeStore((state) => state.connect);
  const reset = useNotificationRealtimeStore((state) => state.reset);
  const refresh = useNotificationRealtimeStore((state) => state.refresh);
  const markRead = useNotificationRealtimeStore((state) => state.markRead);
  const markAllRead = useNotificationRealtimeStore((state) => state.markAllRead);
  const items = useNotificationRealtimeStore((state) => state.items);
  const unreadCount = useNotificationRealtimeStore((state) => state.unreadCount);
  const [canNotify, setCanNotify] = useState(false);

  useEffect(() => {
    const sync = () => {
      const active = hasNotificationSession();
      setCanNotify(active);
      if (!active) {
        reset();
        return;
      }
      reset();
      connect();
      void refresh();
    };

    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [connect, refresh, reset]);

  const localizedText = (item: (typeof items)[number]) => {
    const metadata = item.metadata as { titleEn?: string; bodyEn?: string } | null | undefined;
    if (locale === 'en' && metadata?.titleEn && metadata?.bodyEn) {
      return { title: metadata.titleEn, body: metadata.bodyEn };
    }
    return { title: item.title, body: item.body };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserSiteHeader />
      <main className="site-container py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-gray-900">{m.common.notifications}</h1>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-gray-50"
            >
              {m.common.markAllRead}
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {!canNotify ? (
            <p className="px-6 py-16 text-center text-gray-500">{m.common.login}</p>
          ) : items.length === 0 ? (
            <p className="px-6 py-16 text-center text-gray-500">{m.common.noNotifications}</p>
          ) : (
            items.map((item) => {
              const text = localizedText(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.isRead) void markRead(item.id);
                  }}
                  className={`block w-full border-b border-gray-100 px-6 py-4 text-start transition hover:bg-gray-50 last:border-b-0 ${
                    item.isRead ? '' : 'bg-brand-50/30'
                  }`}
                >
                  <p className="font-bold text-gray-900">{text.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{text.body}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
