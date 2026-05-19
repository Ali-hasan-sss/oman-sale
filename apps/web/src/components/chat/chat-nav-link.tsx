'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { useI18n } from '@/lib/i18n';
import { useChatRealtimeStore } from '@/store/chat-realtime-store';

export function ChatNavLink({ className }: { className: string }) {
  const { localizedPath, m } = useI18n();
  const connect = useChatRealtimeStore((state) => state.connect);
  const unreadCount = useChatRealtimeStore((state) => state.unreadCount);

  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <Link className={`${className} relative`} href={localizedPath('/chats')}>
      {m.common.chats}
      {unreadCount > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
