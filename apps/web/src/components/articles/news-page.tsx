'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ArticleCard, type ArticleCardData } from '@/components/articles/article-card';
import { ArticleCardsSkeleton } from '@/components/articles/article-skeleton';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { FilterChipsSkeleton } from '@/components/stores/store-card-skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
type ArticleCard = ArticleCardData & { id: string };

type ArticleCategory = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  _count?: { articles: number };
};

type PagedArticles = {
  items: ArticleCard[];
  total: number;
  page: number;
  limit: number;
};

const PAGE_SIZE = 20;

export function NewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, localizedPath, m } = useI18n();

  const query = (searchParams.get('q') ?? '').trim();
  const categorySlug = searchParams.get('category') ?? '';

  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [articles, setArticles] = useState<ArticleCard[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoadingCategories(true);
    api
      .get<{ data: ArticleCategory[] }>('/articles/categories')
      .then((response) => setCategories(response.data.data))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  const loadArticles = useCallback(async () => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await api.get<{ data: PagedArticles }>('/articles', {
        params: {
          page,
          limit: PAGE_SIZE,
          q: query || undefined,
          categorySlug: categorySlug || undefined
        }
      });
      const { items, total: nextTotal } = response.data.data;
      setArticles((current) => (page === 1 ? items : [...current, ...items]));
      setTotal(nextTotal);
    } catch {
      if (page === 1) {
        setArticles([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, query, categorySlug]);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    setPage(1);
    setArticles([]);
  }, [query, categorySlug]);

  const updateParams = (updates: { q?: string | null; category?: string | null }) => {
    const params = new URLSearchParams();
    const nextQ = updates.q !== undefined ? updates.q : query;
    const nextCategory = updates.category !== undefined ? updates.category : categorySlug;

    if (nextQ) params.set('q', nextQ);
    if (nextCategory) params.set('category', nextCategory);

    const queryString = params.toString();
    router.push(queryString ? `${localizedPath('/news')}?${queryString}` : localizedPath('/news'));
  };

  const setCategory = (slug: string) => {
    updateParams({ category: slug || null });
  };

  const loadMore = () => {
    setPage((current) => current + 1);
  };

  const hasMore = articles.length < total;
  const showInitialLoading = loading && page === 1;
  const emptyMessage = query || categorySlug ? m.articles.emptySearch : m.articles.empty;

  return (
    <div className="site-page-shell bg-slate-50">
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-black text-slate-900">{m.articles.pageTitle}</h1>
          {!showInitialLoading ? (
            <p className="mt-2 text-sm font-bold text-slate-500">
              {total.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')} {m.articles.results}
            </p>
          ) : null}
        </div>

        <div className="mb-6">
          {loadingCategories ? (
            <FilterChipsSkeleton count={6} />
          ) : (
            <div className="filter-chips-scroll flex gap-2 overflow-x-auto pb-2">
              <FilterChip active={!categorySlug} onClick={() => setCategory('')}>
                {m.articles.allCategories}
              </FilterChip>
              {categories.map((category) => (
                <FilterChip
                  key={category.id}
                  active={categorySlug === category.slug}
                  onClick={() => setCategory(categorySlug === category.slug ? '' : category.slug)}
                >
                  {locale === 'en' ? category.nameEn : category.nameAr}
                </FilterChip>
              ))}
            </div>
          )}
        </div>

        {showInitialLoading ? (
          <ArticleCardsSkeleton count={6} />
        ) : articles.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-slate-500">{emptyMessage}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {hasMore ? (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-xl bg-brand-600 px-8 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {loadingMore ? m.articles.loadingMore : m.articles.loadMore}
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
        active ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 shadow-sm hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}
