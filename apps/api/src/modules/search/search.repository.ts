import { prisma } from '../../shared/prisma/client';
import type { SearchQuery, SearchSuggestionsQuery } from './search.validation';

const publishedArticleWhere = {
  deletedAt: null,
  status: 'PUBLISHED' as const,
  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }]
};

export class SearchRepository {
  searchAds(query: SearchQuery) {
    return prisma.ad.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } }
        ]
      },
      include: { images: true, category: true, promotion: { include: { plan: true } } },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: [{ promotion: { plan: { priorityScore: 'desc' } } }, { createdAt: 'desc' }]
    });
  }

  async getSuggestions(query: SearchSuggestionsQuery) {
    const term = query.q.trim();
    const contains = { contains: term, mode: 'insensitive' as const };
    const limit = query.limit;
    const isEn = query.locale === 'en';

    const [listings, categories, articles, tourism, stores] = await Promise.all([
      prisma.ad.findMany({
        where: { deletedAt: null, status: 'ACTIVE', isActive: true, title: contains },
        select: { id: true, title: true },
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.category.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          OR: [{ nameAr: contains }, { nameEn: contains }, { name: contains }, { slug: contains }]
        },
        select: { id: true, slug: true, nameAr: true, nameEn: true, name: true },
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
      }),
      prisma.article.findMany({
        where: {
          ...publishedArticleWhere,
          OR: [{ titleAr: contains }, { titleEn: contains }, { slug: contains }]
        },
        select: { id: true, slug: true, titleAr: true, titleEn: true },
        take: limit,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
      }),
      prisma.tourismDestination.findMany({
        where: {
          isActive: true,
          OR: [
            { titleAr: contains },
            { titleEn: contains },
            { slug: contains },
            { aboutAr: contains },
            { aboutEn: contains },
            { addressAr: contains },
            { addressEn: contains }
          ]
        },
        select: { id: true, slug: true, titleAr: true, titleEn: true },
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      }),
      prisma.store.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          OR: [{ nameAr: contains }, { nameEn: contains }, { slug: contains }]
        },
        select: { id: true, slug: true, nameAr: true, nameEn: true },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const suggestions = [
      ...categories.map((item) => ({
        type: 'category' as const,
        id: item.id,
        slug: item.slug,
        label: (isEn ? item.nameEn : item.nameAr) || item.name
      })),
      ...listings.map((item) => ({
        type: 'listing' as const,
        id: item.id,
        label: item.title
      })),
      ...articles.map((item) => ({
        type: 'article' as const,
        id: item.id,
        slug: item.slug,
        label: isEn ? item.titleEn : item.titleAr
      })),
      ...tourism.map((item) => ({
        type: 'tourism' as const,
        id: item.id,
        slug: item.slug,
        label: isEn ? item.titleEn : item.titleAr
      })),
      ...stores.map((item) => ({
        type: 'store' as const,
        id: item.id,
        slug: item.slug,
        label: isEn ? item.nameEn : item.nameAr
      }))
    ];

    return { suggestions: suggestions.slice(0, limit * 4) };
  }
}

export const searchRepository = new SearchRepository();
