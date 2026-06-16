'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';

type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY' | 'DISLIKE';

type ReactionsData = {
  counts: Record<ReactionType, number>;
  emojis: Record<ReactionType, string>;
  total: number;
  userReaction: ReactionType | null;
};

const REACTION_ORDER: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY', 'DISLIKE'];

type ArticleReactionsProps = {
  articleId: string;
};

export function ArticleReactions({ articleId }: ArticleReactionsProps) {
  const router = useRouter();
  const { localizedPath, m } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ReactionsData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = getUserAccessToken();

  const load = async () => {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const response = await api.get<{ data: ReactionsData }>(`/articles/${articleId}/reactions`, { headers });
    setData(response.data.data);
  };

  useEffect(() => {
    void load();
  }, [articleId]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const react = async (type: ReactionType) => {
    const authToken = getUserAccessToken();
    if (!authToken) {
      router.push(localizedPath('/login'));
      return;
    }

    setLoading(true);
    try {
      if (data?.userReaction === type) {
        const response = await api.delete<{ data: ReactionsData }>(`/articles/${articleId}/reactions`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setData(response.data.data);
      } else {
        const response = await api.post<{ data: ReactionsData }>(
          `/articles/${articleId}/reactions`,
          { type },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setData(response.data.data);
      }
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;

  const activeEmoji = data.userReaction ? data.emojis[data.userReaction] : '👍';
  const topReactions = REACTION_ORDER.filter((type) => data.counts[type] > 0)
    .sort((a, b) => data.counts[b] - data.counts[a])
    .slice(0, 3);

  return (
    <div ref={rootRef} className="relative min-w-0 max-w-full">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => setOpen((value) => !value)}
          className={`inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
            data.userReaction
              ? 'border-brand-200 bg-brand-50 text-brand-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="text-lg">{activeEmoji}</span>
          <span>{data.userReaction ? m.articles.reacted : m.articles.react}</span>
        </button>

        {data.total > 0 ? (
          <div className="flex min-w-0 items-center gap-1 text-sm text-slate-600">
            {topReactions.map((type) => (
              <span key={type} className="text-base" title={String(data.counts[type])}>
                {data.emojis[type]}
              </span>
            ))}
            <span className="font-bold">{data.total}</span>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="absolute start-0 top-full z-20 mt-2 w-[min(100%,18rem)] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="grid grid-cols-4 gap-1 sm:flex sm:flex-wrap sm:justify-center">
            {REACTION_ORDER.map((type) => (
              <button
                key={type}
                type="button"
                title={String(data.counts[type])}
                onClick={() => void react(type)}
                className={`flex h-11 w-full items-center justify-center rounded-xl text-2xl transition hover:scale-105 sm:h-auto sm:w-auto sm:px-2 sm:py-1 ${
                  data.userReaction === type ? 'bg-brand-50 ring-2 ring-brand-300' : 'hover:bg-slate-50'
                }`}
              >
                {data.emojis[type]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
