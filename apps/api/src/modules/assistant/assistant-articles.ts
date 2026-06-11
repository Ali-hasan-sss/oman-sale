import { articlesRepository } from '../articles/articles.repository';
import { resolveArticlesMedia } from '../../shared/utils/resolve-entity-media';
import type { AssistantAuthContext } from './assistant-auth-actions';
import type { AssistantAction, AssistantArticleCard, SearchArticlesToolArgs } from './assistant.types';
import type { AssistantLocale } from './assistant.validation';

const ASSISTANT_ARTICLES_LIMIT = 4;

function stripArticleHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildNewsBrowsePath(locale: AssistantLocale, q?: string) {
  const base = `/${locale}/news`;
  const trimmed = q?.trim();
  return trimmed ? `${base}?q=${encodeURIComponent(trimmed)}` : base;
}

function mapArticle(
  article: {
    id: string;
    slug: string;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    coverImageUrl: string;
    views: number;
    publishedAt: Date | null;
    category?: { nameAr: string; nameEn: string } | null;
  },
  locale: AssistantLocale
): AssistantArticleCard {
  const title = locale === 'ar' ? article.titleAr : article.titleEn;
  const body = locale === 'ar' ? article.bodyAr : article.bodyEn;

  return {
    id: article.id,
    slug: article.slug,
    title,
    excerpt: stripArticleHtml(body).slice(0, 180),
    coverImageUrl: article.coverImageUrl,
    views: article.views,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    categoryName: locale === 'ar' ? article.category?.nameAr : article.category?.nameEn
  };
}

export async function executeSearchArticles(
  args: SearchArticlesToolArgs,
  auth: AssistantAuthContext
): Promise<{
  articles: AssistantArticleCard[];
  count: number;
  isFallback: boolean;
  summary: string;
  actions: AssistantAction[];
}> {
  const locale = auth.locale;
  const limit = Math.min(Math.max(args.limit ?? 2, 1), ASSISTANT_ARTICLES_LIMIT);
  const query = args.q?.trim();

  let items;
  let isFallback = false;

  if (query) {
    const result = await articlesRepository.list({ page: 1, limit, q: query });
    items = result.items;
    if (items.length === 0) {
      items = await articlesRepository.listLatest(limit);
      isFallback = items.length > 0;
    }
  } else {
    items = await articlesRepository.listLatest(limit);
  }

  const articles = resolveArticlesMedia(items).map((article) => mapArticle(article, locale));
  const viewAllLabel = locale === 'ar' ? 'عرض كل المقالات' : 'View all articles';

  const summary =
    articles.length === 0
      ? locale === 'ar'
        ? 'لا توجد مقالات منشورة مطابقة حالياً على Oman Sale.'
        : 'No matching published articles are available on Oman Sale right now.'
      : query && isFallback
        ? locale === 'ar'
          ? `لم أجد مقالات مطابقة لـ"${query}"، هذه أحدث المقالات المتاحة:`
          : `No exact match for "${query}" — here are the latest available articles:`
        : articles.length === 1
          ? locale === 'ar'
            ? `وجدت مقالة واحدة: ${articles[0]!.title}`
            : `Found one article: ${articles[0]!.title}`
          : locale === 'ar'
            ? `وجدت ${articles.length} مقالات.`
            : `Found ${articles.length} articles.`;

  const actions: AssistantAction[] = [
    {
      label: viewAllLabel,
      href: buildNewsBrowsePath(locale, query),
      variant: articles.length === 1 ? 'default' : 'primary'
    }
  ];

  if (articles.length === 1) {
    actions.unshift({
      label: locale === 'ar' ? 'قراءة المقالة' : 'Read article',
      href: `/${locale}/news/${articles[0]!.slug}`,
      variant: 'primary'
    });
  }

  return {
    articles,
    count: articles.length,
    isFallback,
    summary,
    actions
  };
}
