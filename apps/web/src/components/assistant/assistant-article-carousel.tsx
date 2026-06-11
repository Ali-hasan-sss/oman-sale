'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { AssistantArticleCard } from '@/hooks/use-assistant-chat';
import { useI18n } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media-url';

type AssistantArticleCarouselProps = {
  articles: AssistantArticleCard[];
};

const placeholderImage = '/logo.png';

export function AssistantArticleCarousel({ articles }: AssistantArticleCarouselProps) {
  const { localizedPath, m } = useI18n();

  if (articles.length === 0) return null;

  return (
    <div className="assistant-scrollbar-none -mx-0.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-1">
      {articles.map((article) => (
        <article
          key={article.id}
          className="flex w-[168px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white shadow-sm"
        >
          <div className="relative aspect-[16/10] w-full bg-[#F5F5F5]">
            <Image
              src={resolveMediaUrl(article.coverImageUrl) || placeholderImage}
              alt={article.title}
              fill
              className="object-cover"
              sizes="168px"
            />
            {article.categoryName ? (
              <span className="absolute start-2 top-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                {article.categoryName}
              </span>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col p-2.5">
            <h4 className="line-clamp-2 text-sm font-semibold text-brand-700">{article.title}</h4>
            {article.excerpt ? (
              <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-[#6B6B6B]">{article.excerpt}</p>
            ) : null}
            <p className="mt-2 text-[11px] text-[#9A9A9A]">
              {article.views} {m.articles.views}
            </p>
            <Link
              href={localizedPath(`/news/${article.slug}`)}
              className="mt-3 block rounded-lg bg-brand-600 py-2 text-center text-[11px] font-medium text-white transition-opacity hover:opacity-90"
            >
              {m.articles.readArticle}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
