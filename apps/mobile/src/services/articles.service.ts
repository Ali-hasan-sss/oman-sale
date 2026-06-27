import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import { normalizePage } from '../lib/pagination';

export type ArticleCategory = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  _count?: { articles: number };
};

export type ArticleSummary = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  coverImageUrl: string;
  views: number;
  publishedAt?: string | null;
  category?: { nameAr: string; nameEn: string };
};

export type ArticleDetails = ArticleSummary & {
  galleryImages: string[];
};

export async function fetchArticleCategories() {
  const response = await http.get<ApiEnvelope<ArticleCategory[]>>(API_ENDPOINTS.articles.categories);
  return Array.isArray(response.data.data) ? response.data.data : [];
}

export async function fetchArticles(params?: {
  page?: number;
  limit?: number;
  q?: string;
  categorySlug?: string;
}) {
  const response = await http.get<ApiEnvelope<{ items: ArticleSummary[]; total: number; page: number; limit: number }>>(
    API_ENDPOINTS.articles.list,
    { params }
  );
  return normalizePage(response.data.data, params?.page ?? 1, params?.limit ?? 20);
}

export async function fetchArticleBySlug(slug: string) {
  const response = await http.get<ApiEnvelope<ArticleDetails>>(API_ENDPOINTS.articles.bySlug(slug));
  return response.data.data;
}

export type ArticleComment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; fullName: string; avatar?: string | null };
};

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY' | 'DISLIKE';

export type ArticleReactionsData = {
  counts: Record<ReactionType, number>;
  emojis: Record<ReactionType, string>;
  total: number;
  userReaction: ReactionType | null;
};

export async function fetchArticleComments(articleId: string, page = 1, limit = 10) {
  const response = await http.get<ApiEnvelope<{ items: ArticleComment[]; total: number; page: number; limit: number }>>(
    API_ENDPOINTS.articles.comments(articleId),
    { params: { page, limit } }
  );
  return normalizePage(response.data.data, page, limit);
}

export async function createArticleComment(articleId: string, body: string) {
  const response = await http.post<ApiEnvelope<ArticleComment>>(API_ENDPOINTS.articles.comments(articleId), { body });
  return response.data.data;
}

export async function updateArticleComment(articleId: string, commentId: string, body: string) {
  const response = await http.patch<ApiEnvelope<ArticleComment>>(
    API_ENDPOINTS.articles.comment(articleId, commentId),
    { body }
  );
  return response.data.data;
}

export async function deleteArticleComment(articleId: string, commentId: string) {
  await http.delete(API_ENDPOINTS.articles.comment(articleId, commentId));
}

export async function fetchArticleReactions(articleId: string) {
  const response = await http.get<ApiEnvelope<ArticleReactionsData>>(API_ENDPOINTS.articles.reactions(articleId));
  return response.data.data;
}

export async function setArticleReaction(articleId: string, type: ReactionType) {
  const response = await http.post<ApiEnvelope<ArticleReactionsData>>(API_ENDPOINTS.articles.reactions(articleId), { type });
  return response.data.data;
}

export async function removeArticleReaction(articleId: string) {
  const response = await http.delete<ApiEnvelope<ArticleReactionsData>>(API_ENDPOINTS.articles.reactions(articleId));
  return response.data.data;
}
