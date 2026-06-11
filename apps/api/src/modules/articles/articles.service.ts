import { ArticleReactionType } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { resolveArticleMedia, resolveArticlesMedia, resolveUserMedia } from '../../shared/utils/resolve-entity-media';
import type { ViewerContext } from '../../shared/utils/viewer-context';
import { articlesRepository } from './articles.repository';
import type {
  ArticleCategoryInput,
  ArticleInput,
  ListArticlesQuery,
  UpdateArticleCategoryInput,
  UpdateArticleInput
} from './articles.validation';

const MAX_CATEGORIES = 10;

export const ARTICLE_REACTION_EMOJI: Record<ArticleReactionType, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠',
  DISLIKE: '👎'
};

export class ArticlesService {
  listCategories(includeInactive = false) {
    return articlesRepository.listCategories(includeInactive);
  }

  async getCategory(id: string) {
    const category = await articlesRepository.findCategoryById(id);
    if (!category) throw new ApiError(404, 'Article category not found');
    return category;
  }

  async createCategory(input: ArticleCategoryInput) {
    const count = await articlesRepository.countCategories();
    if (count >= MAX_CATEGORIES) {
      throw new ApiError(400, `Maximum of ${MAX_CATEGORIES} article categories allowed`);
    }
    return articlesRepository.createCategory(input);
  }

  async updateCategory(id: string, input: UpdateArticleCategoryInput) {
    await this.getCategory(id);
    return articlesRepository.updateCategory(id, input);
  }

  async deleteCategory(id: string) {
    await this.getCategory(id);
    return articlesRepository.deleteCategory(id);
  }

  async list(query: ListArticlesQuery, options?: { admin?: boolean }) {
    const page = await articlesRepository.list(query, options);
    return { ...page, items: resolveArticlesMedia(page.items) };
  }

  async listLatest(limit: number) {
    const items = await articlesRepository.listLatest(limit);
    return resolveArticlesMedia(items);
  }

  async get(idOrSlug: string, viewer?: ViewerContext, options?: { admin?: boolean }) {
    const article =
      idOrSlug.length === 36 ? await articlesRepository.findById(idOrSlug) : await articlesRepository.findBySlug(idOrSlug);

    if (!article) throw new ApiError(404, 'Article not found');
    if (!options?.admin && article.status !== 'PUBLISHED') {
      throw new ApiError(404, 'Article not found');
    }
    if (!options?.admin && article.publishedAt && article.publishedAt > new Date()) {
      throw new ApiError(404, 'Article not found');
    }

    if (viewer && !options?.admin) {
      const counted = await articlesRepository.recordView(article.id, viewer);
      if (counted) {
        return resolveArticleMedia({ ...article, views: article.views + 1 });
      }
    }

    return resolveArticleMedia(article);
  }

  create(input: ArticleInput) {
    return articlesRepository.create(input).then(resolveArticleMedia);
  }

  async update(id: string, input: UpdateArticleInput) {
    await this.get(id, undefined, { admin: true });
    return articlesRepository.update(id, input).then(resolveArticleMedia);
  }

  async delete(id: string) {
    await this.get(id, undefined, { admin: true });
    return articlesRepository.softDelete(id);
  }

  async listSaves(userId: string) {
    const saves = await articlesRepository.listSaves(userId);
    return saves.map((save) => ({
      ...resolveArticleMedia(save.article),
      savedAt: save.createdAt
    }));
  }

  listSaveIds(userId: string) {
    return articlesRepository.listSaveIds(userId);
  }

  async save(articleId: string, userId: string) {
    await this.get(articleId);
    return articlesRepository.save(articleId, userId);
  }

  unsave(articleId: string, userId: string) {
    return articlesRepository.unsave(articleId, userId);
  }

  async listComments(articleId: string, page: number, limit: number) {
    await this.get(articleId);
    const result = await articlesRepository.listComments(articleId, page, limit);
    return {
      ...result,
      items: result.items.map((comment) => ({
        ...comment,
        user: resolveUserMedia(comment.user)
      }))
    };
  }

  async createComment(articleId: string, userId: string, body: string) {
    await this.get(articleId);
    const comment = await articlesRepository.createComment(articleId, userId, body);
    return { ...comment, user: resolveUserMedia(comment.user) };
  }

  async updateComment(commentId: string, userId: string, body: string) {
    const comment = await articlesRepository.updateComment(commentId, userId, body);
    if (!comment) throw new ApiError(404, 'Comment not found');
    return { ...comment, user: resolveUserMedia(comment.user) };
  }

  async deleteComment(commentId: string, userId: string) {
    const result = await articlesRepository.deleteComment(commentId, userId);
    if (result.count === 0) throw new ApiError(404, 'Comment not found');
    return result;
  }

  async getReactions(articleId: string, userId?: string) {
    await this.get(articleId);
    const [summary, userReaction] = await Promise.all([
      articlesRepository.getReactionSummary(articleId),
      userId ? articlesRepository.getUserReaction(articleId, userId) : null
    ]);

    const counts = {
      LIKE: 0,
      LOVE: 0,
      HAHA: 0,
      WOW: 0,
      SAD: 0,
      ANGRY: 0,
      DISLIKE: 0
    } satisfies Record<ArticleReactionType, number>;

    for (const row of summary) {
      counts[row.type] = row._count.type;
    }

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

    return {
      counts,
      emojis: ARTICLE_REACTION_EMOJI,
      total,
      userReaction: userReaction?.type ?? null
    };
  }

  async setReaction(articleId: string, userId: string, type: ArticleReactionType) {
    await this.get(articleId);
    await articlesRepository.upsertReaction(articleId, userId, type);
    return this.getReactions(articleId, userId);
  }

  async removeReaction(articleId: string, userId: string) {
    await this.get(articleId);
    await articlesRepository.removeReaction(articleId, userId);
    return this.getReactions(articleId, userId);
  }
}

export const articlesService = new ArticlesService();
