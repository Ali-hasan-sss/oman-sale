'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ArticleCard, type ArticleCardData } from '@/components/articles/article-card';
import { ArticleCardsSkeleton } from '@/components/articles/article-skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type ArticleCard = ArticleCardData & { id: string };

export function ArticlesSection() {
  const { localizedPath, m } = useI18n();
  const [articles, setArticles] = useState<ArticleCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api
      .get<{ data: ArticleCard[] }>('/articles/latest', { params: { limit: 3 } })
      .then((response) => {
        if (!cancelled) setArticles(response.data.data);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoading && articles.length === 0) return null;

  return (
    <section className="mb-14">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-ink-900">{m.articles.sectionTitle}</h2>
          <span className="mt-3 flex h-1 w-20 overflow-hidden rounded-full" aria-hidden>
            <span className="flex-1 bg-brick-500" />
            <span className="flex-1 bg-slate-200" />
            <span className="flex-1 bg-brand-500" />
          </span>
          <p className="mt-3 text-sm text-slate-600">{m.articles.sectionSubtitle}</p>
        </div>
        <Link
          href={localizedPath('/news')}
          className="mt-2 shrink-0 text-sm font-black text-brand-700 underline decoration-2 underline-offset-4 transition hover:text-brick-500"
        >
          {m.articles.viewAll}
        </Link>
      </div>

      {isLoading ? (
        <ArticleCardsSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} imageHeightClass="h-44" titleClassName="text-lg" />
          ))}
        </div>
      )}

    </section>
  );
}
