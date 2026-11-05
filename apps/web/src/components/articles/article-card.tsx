'use client';

import Link from 'next/link';

import { stripArticleHtml } from '@/lib/article-text';
import { useI18n } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media-url';

export type ArticleCardData = {
  slug: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  coverImageUrl: string;
  views: number;
  publishedAt?: string | null;
  category?: { nameAr: string; nameEn: string };
  _count?: {
    comments: number;
    reactions: number;
  };
};

type ArticleCardProps = {
  article: ArticleCardData;
  imageHeightClass?: string;
  titleClassName?: string;
};

const readMinutes = (text: string) => Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));

const readLabel = (minutes: number, locale: string) => {
  if (locale === 'en') return `${minutes} min read`;
  if (minutes === 1) return 'قراءة دقيقة';
  if (minutes === 2) return 'قراءة دقيقتين';
  if (minutes <= 10) return `قراءة ${minutes} دقائق`;
  return `قراءة ${minutes} دقيقة`;
};

export function ArticleCard({
  article,
  imageHeightClass = 'h-48',
  titleClassName = 'text-lg'
}: ArticleCardProps) {
  const { locale, localizedPath } = useI18n();
  const title = locale === 'en' ? article.titleEn : article.titleAr;
  const body = locale === 'en' ? article.bodyEn : article.bodyAr;
  const excerpt = stripArticleHtml(body);
  const categoryName = locale === 'en' ? article.category?.nameEn : article.category?.nameAr;
  const href = localizedPath(`/news/${article.slug}`);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(15,23,42,0.45)]"
    >
      <div className={`relative ${imageHeightClass} overflow-hidden bg-[radial-gradient(circle_at_50%_45%,#ffffff,rgb(var(--oman-green-100))_75%)]`}>
        <span className="absolute inset-0 flex items-center justify-center text-6xl [filter:drop-shadow(0_14px_12px_rgba(15,23,42,0.25))]" aria-hidden>
          📰
        </span>
        {article.coverImageUrl ? (
          <img
            src={resolveMediaUrl(article.coverImageUrl)}
            alt={title}
            loading="lazy"
            className="relative h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        {categoryName ? (
          <span className="mb-2.5 w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-800 ring-1 ring-brand-100">
            {categoryName}
          </span>
        ) : null}
        <h2 className={`line-clamp-2 font-black leading-snug text-ink-900 transition group-hover:text-brand-700 ${titleClassName}`}>
          {title}
        </h2>
        {excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600">{excerpt}</p> : null}
        <p className="mt-auto pt-2.5 text-xs font-bold text-slate-500">{readLabel(readMinutes(excerpt), locale)}</p>
      </div>
    </Link>
  );
}
