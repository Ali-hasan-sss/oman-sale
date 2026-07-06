import { ArticleReactionType, Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import type { ViewerContext } from '../../shared/utils/viewer-context';
import type {
  ArticleCategoryInput,
  ArticleInput,
  ListArticlesQuery,
  UpdateArticleCategoryInput,
  UpdateArticleInput
} from './articles.validation';

const articleInclude = {
  category: true,
  _count: { select: { comments: { where: { deletedAt: null } }, reactions: true, saves: { where: { deletedAt: null } } } }
} satisfies Prisma.ArticleInclude;

const getPublishedWhere = (): Prisma.ArticleWhereInput => ({
  deletedAt: null,
  status: 'PUBLISHED',
  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }]
});

export class ArticlesRepository {
  countCategories() {
    return prisma.articleCategory.count();
  }

  listCategories(includeInactive = false) {
    return prisma.articleCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { articles: { where: getPublishedWhere() } } } }
    });
  }

  findCategoryById(id: string) {
    return prisma.articleCategory.findUnique({ where: { id } });
  }

  findCategoryBySlug(slug: string) {
    return prisma.articleCategory.findUnique({ where: { slug } });
  }

  createCategory(data: ArticleCategoryInput) {
    return prisma.articleCategory.create({
      data: {
        ...data,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true
      }
    });
  }

  updateCategory(id: string, data: UpdateArticleCategoryInput) {
    return prisma.articleCategory.update({ where: { id }, data });
  }

  deleteCategory(id: string) {
    return prisma.articleCategory.delete({ where: { id } });
  }

  async list(query: ListArticlesQuery, options?: { admin?: boolean }) {
    const searchTerm = query.q?.trim();
    if (searchTerm && !options?.admin) {
      return this.listPublishedWithSearch(query, searchTerm);
    }

    const where: Prisma.ArticleWhereInput = {
      ...(options?.admin ? { deletedAt: null } : getPublishedWhere()),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.categorySlug && { category: { slug: query.categorySlug } }),
      ...(searchTerm && {
        OR: [
          { titleAr: { contains: searchTerm, mode: 'insensitive' } },
          { titleEn: { contains: searchTerm, mode: 'insensitive' } },
          { bodyAr: { contains: searchTerm, mode: 'insensitive' } },
          { bodyEn: { contains: searchTerm, mode: 'insensitive' } },
          { slug: { contains: searchTerm, mode: 'insensitive' } }
        ]
      })
    };

    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      prisma.article.count({ where })
    ]);

    return { items, total, page: query.page, limit: query.limit };
  }

  private async listPublishedWithSearch(query: ListArticlesQuery, searchTerm: string) {
    const skip = (query.page - 1) * query.limit;
    const contains = `%${searchTerm}%`;
    const starts = `${searchTerm}%`;
    const categoryJoin = query.categorySlug
      ? Prisma.sql`INNER JOIN "ArticleCategory" c ON c.id = a."categoryId"`
      : Prisma.empty;
    const categoryFilter = query.categoryId
      ? Prisma.sql`AND a."categoryId" = ${query.categoryId}`
      : query.categorySlug
        ? Prisma.sql`AND c.slug = ${query.categorySlug}`
        : Prisma.empty;
    const relevanceScore = Prisma.sql`
      GREATEST(
        CASE WHEN lower(a."titleAr") = lower(${searchTerm}) OR lower(a."titleEn") = lower(${searchTerm}) THEN 100 ELSE 0 END,
        CASE WHEN a."titleAr" ILIKE ${starts} OR a."titleEn" ILIKE ${starts} THEN 80 ELSE 0 END,
        CASE WHEN a."titleAr" ILIKE ${contains} OR a."titleEn" ILIKE ${contains} THEN 60 ELSE 0 END,
        CASE WHEN a."slug" ILIKE ${contains} THEN 55 ELSE 0 END,
        CASE WHEN a."bodyAr" ILIKE ${contains} OR a."bodyEn" ILIKE ${contains} THEN 30 ELSE 0 END
      )
    `;

    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string }>>`
        SELECT a.id
        FROM "Article" a
        ${categoryJoin}
        WHERE a."deletedAt" IS NULL
          AND a.status = 'PUBLISHED'
          AND (a."publishedAt" IS NULL OR a."publishedAt" <= NOW())
          AND (
            a."titleAr" ILIKE ${contains}
            OR a."titleEn" ILIKE ${contains}
            OR a."bodyAr" ILIKE ${contains}
            OR a."bodyEn" ILIKE ${contains}
            OR a."slug" ILIKE ${contains}
          )
          ${categoryFilter}
        ORDER BY ${relevanceScore} DESC, a."publishedAt" DESC NULLS LAST, a."createdAt" DESC
        LIMIT ${query.limit} OFFSET ${skip}
      `,
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "Article" a
        ${categoryJoin}
        WHERE a."deletedAt" IS NULL
          AND a.status = 'PUBLISHED'
          AND (a."publishedAt" IS NULL OR a."publishedAt" <= NOW())
          AND (
            a."titleAr" ILIKE ${contains}
            OR a."titleEn" ILIKE ${contains}
            OR a."bodyAr" ILIKE ${contains}
            OR a."bodyEn" ILIKE ${contains}
            OR a."slug" ILIKE ${contains}
          )
          ${categoryFilter}
      `
    ]);

    const ids = rows.map((row) => row.id);
    if (ids.length === 0) {
      return { items: [], total: Number(countRows[0]?.count ?? 0), page: query.page, limit: query.limit };
    }

    const items = await prisma.article.findMany({
      where: { id: { in: ids } },
      include: articleInclude
    });
    const itemMap = new Map(items.map((item) => [item.id, item]));

    return {
      items: ids.map((id) => itemMap.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item)),
      total: Number(countRows[0]?.count ?? 0),
      page: query.page,
      limit: query.limit
    };
  }

  listLatest(limit: number) {
    return prisma.article.findMany({
      where: getPublishedWhere(),
      include: articleInclude,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit
    });
  }

  findById(id: string) {
    return prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: articleInclude
    });
  }

  findBySlug(slug: string) {
    return prisma.article.findFirst({
      where: { slug, deletedAt: null },
      include: articleInclude
    });
  }

  create(data: ArticleInput) {
    const publishedAt = data.status === 'PUBLISHED' ? (data.publishedAt ?? new Date()) : data.publishedAt ?? null;
    return prisma.article.create({
      data: {
        ...data,
        galleryImages: data.galleryImages ?? [],
        status: data.status ?? 'DRAFT',
        publishedAt
      },
      include: articleInclude
    });
  }

  update(id: string, data: UpdateArticleInput) {
    const publishedAt =
      data.status === 'PUBLISHED' && data.publishedAt === undefined
        ? new Date()
        : data.publishedAt;

    return prisma.article.update({
      where: { id },
      data: {
        ...data,
        ...(publishedAt !== undefined && { publishedAt })
      },
      include: articleInclude
    });
  }

  softDelete(id: string) {
    return prisma.article.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' }
    });
  }

  async recordView(articleId: string, context: ViewerContext) {
    try {
      await prisma.$transaction([
        prisma.articleView.create({
          data: {
            articleId,
            visitorKey: context.visitorKey,
            ipAddress: context.ipAddress,
            source: context.source,
            userAgent: context.userAgent?.slice(0, 500)
          }
        }),
        prisma.article.update({ where: { id: articleId }, data: { views: { increment: 1 } } })
      ]);
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }
      throw error;
    }
  }

  listSaves(userId: string) {
    return prisma.articleSave.findMany({
      where: { userId, deletedAt: null, article: getPublishedWhere() },
      include: {
        article: { include: articleInclude }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  listSaveIds(userId: string) {
    return prisma.articleSave
      .findMany({
        where: { userId, deletedAt: null, article: getPublishedWhere() },
        select: { articleId: true }
      })
      .then((rows) => rows.map((row) => row.articleId));
  }

  save(articleId: string, userId: string) {
    return prisma.articleSave.upsert({
      where: { userId_articleId: { userId, articleId } },
      update: { deletedAt: null },
      create: { userId, articleId }
    });
  }

  unsave(articleId: string, userId: string) {
    return prisma.articleSave.updateMany({
      where: { userId, articleId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  async listComments(articleId: string, page: number, limit: number) {
    const where = { articleId, deletedAt: null };

    const [items, total] = await Promise.all([
      prisma.articleComment.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.articleComment.count({ where })
    ]);

    return { items, total, page, limit };
  }

  createComment(articleId: string, userId: string, body: string) {
    return prisma.articleComment.create({
      data: { articleId, userId, body },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } }
      }
    });
  }

  async updateComment(commentId: string, userId: string, body: string) {
    const existing = await prisma.articleComment.findFirst({
      where: { id: commentId, userId, deletedAt: null }
    });
    if (!existing) return null;

    return prisma.articleComment.update({
      where: { id: commentId },
      data: { body },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } }
      }
    });
  }

  deleteComment(commentId: string, userId: string) {
    return prisma.articleComment.updateMany({
      where: { id: commentId, userId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  getReactionSummary(articleId: string) {
    return prisma.articleReaction.groupBy({
      by: ['type'],
      where: { articleId },
      _count: { type: true }
    });
  }

  getUserReaction(articleId: string, userId: string) {
    return prisma.articleReaction.findUnique({
      where: { articleId_userId: { articleId, userId } }
    });
  }

  upsertReaction(articleId: string, userId: string, type: ArticleReactionType) {
    return prisma.articleReaction.upsert({
      where: { articleId_userId: { articleId, userId } },
      update: { type },
      create: { articleId, userId, type }
    });
  }

  removeReaction(articleId: string, userId: string) {
    return prisma.articleReaction.deleteMany({
      where: { articleId, userId }
    });
  }
}

export const articlesRepository = new ArticlesRepository();
