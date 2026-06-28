import { useCallback, useEffect, useState } from 'react';

import {
  createArticleComment,
  deleteArticleComment,
  fetchArticleComments,
  updateArticleComment,
  type ArticleComment
} from '../../services/articles.service';

const PAGE_SIZE = 10;
export const COMMENT_MAX_LENGTH = 500;

type UseArticleCommentsOptions = {
  articleId: string;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
};

export function useArticleComments({ articleId, isLoggedIn, onLoginRequired }: UseArticleCommentsOptions) {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasMore = comments.length < total;

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const result = await fetchArticleComments(articleId, nextPage, PAGE_SIZE);
        setTotal(result.total);
        setPage(nextPage);
        setComments((current) => (append ? [...current, ...result.items] : result.items));
      } catch {
        if (!append) {
          setComments([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [articleId]
  );

  useEffect(() => {
    if (!articleId) return;
    void loadPage(1, false);
  }, [articleId, loadPage]);

  const submit = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    const trimmed = body.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const created = await createArticleComment(articleId, trimmed);
      setComments((current) => [created, ...current]);
      setTotal((current) => current + 1);
      setBody('');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await deleteArticleComment(articleId, pendingDeleteId);
      setComments((current) => current.filter((item) => item.id !== pendingDeleteId));
      setTotal((current) => Math.max(0, current - 1));
      setPendingDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const updateComment = (updated: ArticleComment) => {
    setComments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const requestDelete = (commentId: string) => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    setPendingDeleteId(commentId);
  };

  return {
    comments,
    body,
    setBody,
    loading,
    loadingMore,
    submitting,
    pendingDeleteId,
    setPendingDeleteId,
    deleting,
    hasMore,
    page,
    loadPage,
    submit,
    confirmDelete,
    updateComment,
    requestDelete,
    updateArticleComment
  };
}
