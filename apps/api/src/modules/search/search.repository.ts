import { prisma } from '../../shared/prisma/client';
import type { SearchQuery } from './search.validation';

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
}

export const searchRepository = new SearchRepository();
