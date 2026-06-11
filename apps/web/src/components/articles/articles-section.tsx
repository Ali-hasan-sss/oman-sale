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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-bold text-brand-600">{m.articles.sectionLabel}</p>
          <h2 className="text-3xl font-black text-slate-900">{m.articles.sectionTitle}</h2>
          <p className="mt-2 text-slate-600">{m.articles.sectionSubtitle}</p>
        </div>
        <Link href={localizedPath('/news')} className="rounded-xl border border-brand-200 px-5 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50">
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

      <div className="mt-8 text-center">
        <Link
          href={localizedPath('/news')}
          className="inline-flex rounded-xl bg-brand-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          {m.articles.viewAll}
        </Link>
      </div>
    </section>
  );
}
