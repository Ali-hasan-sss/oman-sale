'use client';

import { ArrowLeft, ArrowRight, Calendar, Eye, MessageCircle, Smile } from 'lucide-react';
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

export function ArticleCard({
  article,
  imageHeightClass = 'h-48',
  titleClassName = 'text-xl'
}: ArticleCardProps) {
  const { dir, locale, localizedPath, m } = useI18n();
  const title = locale === 'en' ? article.titleEn : article.titleAr;
  const body = locale === 'en' ? article.bodyEn : article.bodyAr;
  const excerpt = stripArticleHtml(body);
  const categoryName = locale === 'en' ? article.category?.nameEn : article.category?.nameAr;
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'ar-OM')
    : '';
  const ReadArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const reactionCount = article._count?.reactions ?? 0;
  const commentCount = article._count?.comments ?? 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link href={localizedPath(`/news/${article.slug}`)} className="block overflow-hidden">
        <div className={`relative ${imageHeightClass} overflow-hidden`}>
          <img
            src={resolveMediaUrl(article.coverImageUrl)}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {categoryName ? (
            <span className="absolute start-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-700">
              {categoryName}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={localizedPath(`/news/${article.slug}`)} className="block">
          <h2 className={`line-clamp-2 font-black text-slate-900 transition group-hover:text-brand-700 ${titleClassName}`}>
            {title}
          </h2>
        </Link>

        {excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{excerpt}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {date ? (
            <span className="inline-flex items-center gap-1">
              <Calendar size={13} />
              {date}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1" title={m.articles.views}>
            <Eye size={13} />
            {article.views}
          </span>
          <span className="inline-flex items-center gap-1" title={m.articles.react}>
            <Smile size={13} />
            {reactionCount}
          </span>
          <span className="inline-flex items-center gap-1" title={m.articles.commentsTitle}>
            <MessageCircle size={13} />
            {commentCount}
          </span>
        </div>

        <div className="mt-auto pt-4">
          <Link
            href={localizedPath(`/news/${article.slug}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
          >
            {m.articles.readArticle}
            <ReadArrow size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
