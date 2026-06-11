'use client';

import { Check, Loader2, Pencil, Send, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { ArticleCommentsSkeleton } from '@/components/articles/article-skeleton';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media-url';
import { getStoredUser, getUserAccessToken } from '@/lib/user-auth';

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; fullName: string; avatar?: string | null };
};

type PagedComments = {
  items: Comment[];
  total: number;
  page: number;
  limit: number;
};

type ArticleCommentsProps = {
  articleId: string;
  className?: string;
};

const PAGE_SIZE = 10;
const COMMENT_MAX_LENGTH = 500;

const resizeTextarea = (element: HTMLTextAreaElement | null, maxHeight = 120) => {
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
};

export function ArticleComments({ articleId, className = '' }: ArticleCommentsProps) {
  const router = useRouter();
  const { locale, localizedPath, m } = useI18n();
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasMore = comments.length < total;

  useEffect(() => {
    setCurrentUserId(getStoredUser()?.id);
  }, []);

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [body]);

  const loadPage = async (nextPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const response = await api.get<{ data: PagedComments }>(`/articles/${articleId}/comments`, {
        params: { page: nextPage, limit: PAGE_SIZE }
      });
      const { items, total: nextTotal } = response.data.data;
      setTotal(nextTotal);
      setPage(nextPage);
      setComments((current) => (append ? [...current, ...items] : items));
    } catch {
      if (!append) setComments([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadPage(1, false);
  }, [articleId]);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    const token = getUserAccessToken();
    if (!token) {
      router.push(localizedPath('/login'));
      return;
    }

    setDeletingId(pendingDeleteId);
    try {
      await api.delete(`/articles/${articleId}/comments/${pendingDeleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments((current) => current.filter((item) => item.id !== pendingDeleteId));
      setTotal((current) => Math.max(0, current - 1));
      setPendingDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const token = getUserAccessToken();
    if (!token) {
      router.push(localizedPath('/login'));
      return;
    }
    const trimmed = body.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const response = await api.post<{ data: Comment }>(
        `/articles/${articleId}/comments`,
        { body: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((current) => [response.data.data, ...current]);
      setTotal((current) => current + 1);
      setBody('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={className}>
      <h2 className="mb-4 text-xl font-black text-slate-900">{m.articles.commentsTitle}</h2>

      {loading ? (
        <ArticleCommentsSkeleton />
      ) : comments.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">{m.articles.commentsEmpty}</p>
      ) : (
        <>
          <ul className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                articleId={articleId}
                isOwner={currentUserId === comment.user.id}
                locale={locale}
                labels={{
                  readMore: m.articles.commentReadMore,
                  readLess: m.articles.commentReadLess,
                  edit: m.articles.commentEdit,
                  delete: m.articles.commentDelete,
                  save: m.articles.commentSave,
                  cancel: m.articles.commentCancel
                }}
                onUpdated={(updated) => {
                  setComments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                }}
                deleting={deletingId === comment.id}
                onDeleteRequest={() => {
                  const token = getUserAccessToken();
                  if (!token) {
                    router.push(localizedPath('/login'));
                    return;
                  }
                  setPendingDeleteId(comment.id);
                }}
                onLoginRequired={() => router.push(localizedPath('/login'))}
              />
            ))}
          </ul>

          {hasMore ? (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => void loadPage(page + 1, true)}
                disabled={loadingMore}
                className="rounded-xl border border-brand-200 px-6 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
              >
                {loadingMore ? m.articles.loadingMore : m.articles.commentsLoadMore}
              </button>
            </div>
          ) : null}
        </>
      )}

      <form
        onSubmit={submit}
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100"
      >
        <div className="flex items-stretch">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, COMMENT_MAX_LENGTH))}
            onInput={(event) => resizeTextarea(event.currentTarget)}
            rows={1}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder={m.articles.commentPlaceholder}
            className="max-h-[120px] min-h-[48px] flex-1 resize-none overflow-y-auto border-0 bg-transparent px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            aria-label={m.articles.commentSubmit}
            className="flex min-h-[48px] w-[52px] shrink-0 items-center justify-center self-stretch border-s border-slate-200 bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto sm:gap-2 sm:px-4"
          >
            <Send size={18} className={submitting ? 'animate-pulse' : ''} />
            <span className="hidden text-sm font-bold sm:inline">
              {submitting ? m.articles.commentSubmitting : m.articles.commentSubmit}
            </span>
          </button>
        </div>
      </form>

      {pendingDeleteId ? (
        <ConfirmationDialog
          title={m.articles.commentDeleteTitle}
          description={m.articles.commentDeleteConfirm}
          confirmLabel={m.articles.commentDelete}
          cancelLabel={m.articles.commentCancel}
          isConfirming={Boolean(deletingId)}
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={() => void confirmDelete()}
          variant="danger"
        />
      ) : null}
    </section>
  );
}

type CommentItemProps = {
  comment: Comment;
  articleId: string;
  isOwner: boolean;
  locale: string;
  labels: {
    readMore: string;
    readLess: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
  };
  deleting?: boolean;
  onUpdated: (comment: Comment) => void;
  onDeleteRequest: () => void;
  onLoginRequired: () => void;
};

function CommentItem({
  comment,
  articleId,
  isOwner,
  locale,
  labels,
  deleting = false,
  onUpdated,
  onDeleteRequest,
  onLoginRequired
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditBody(comment.body);
  }, [comment.body]);

  useEffect(() => {
    if (editing) resizeTextarea(editRef.current, 160);
  }, [editing, editBody]);

  const startEdit = () => {
    setEditBody(comment.body);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditBody(comment.body);
    setEditing(false);
  };

  const saveEdit = async () => {
    const token = getUserAccessToken();
    if (!token) {
      onLoginRequired();
      return;
    }

    const trimmed = editBody.trim();
    if (!trimmed || trimmed === comment.body) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch<{ data: Comment }>(
        `/articles/${articleId}/comments/${comment.id}`,
        { body: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdated(response.data.data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className={`flex gap-3 border-b border-slate-100 pb-4 last:border-0 ${saving || deleting ? 'opacity-80' : ''}`}>
      {comment.user.avatar ? (
        <img src={resolveMediaUrl(comment.user.avatar)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {comment.user.fullName.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-900">{comment.user.fullName}</span>
          <span className="text-xs text-slate-400">
            {new Date(comment.createdAt).toLocaleString(locale === 'en' ? 'en-GB' : 'ar-OM')}
          </span>
        </div>

        {editing ? (
          <div className="relative mt-2 overflow-hidden rounded-xl border border-brand-200 bg-slate-50">
            <textarea
              ref={editRef}
              value={editBody}
              onChange={(event) => setEditBody(event.target.value.slice(0, COMMENT_MAX_LENGTH))}
              onInput={(event) => resizeTextarea(event.currentTarget, 160)}
              rows={2}
              maxLength={COMMENT_MAX_LENGTH}
              disabled={saving}
              className="max-h-[160px] w-full resize-none overflow-y-auto border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none disabled:opacity-70"
            />
            <div className="flex items-center justify-end gap-1 border-t border-brand-100 px-2 py-1.5">
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={saving || !editBody.trim()}
                aria-label={labels.save}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-brand-600 transition hover:bg-brand-100 disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                aria-label={labels.cancel}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <CommentBody body={comment.body} readMoreLabel={labels.readMore} readLessLabel={labels.readLess} />
            {isOwner ? (
              <div className="mt-1.5 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={startEdit}
                  disabled={deleting || saving}
                  aria-label={labels.edit}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-600 disabled:opacity-50"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={onDeleteRequest}
                  disabled={deleting || saving}
                  aria-label={labels.delete}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin text-red-500" /> : <Trash2 size={14} />}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}

function CommentBody({
  body,
  readMoreLabel,
  readLessLabel
}: {
  body: string;
  readMoreLabel: string;
  readLessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element || expanded) return;

    const measure = () => {
      setOverflows(element.scrollHeight > element.clientHeight + 1);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [body, expanded]);

  return (
    <div className="mt-1">
      <p
        ref={textRef}
        className={`whitespace-pre-wrap text-sm leading-6 text-slate-700 ${expanded ? '' : 'line-clamp-2'}`}
      >
        {body}
      </p>
      {overflows && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-sm font-bold text-brand-600 hover:text-brand-700"
        >
          … {readMoreLabel}
        </button>
      ) : null}
      {expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-1 text-sm font-bold text-slate-500 hover:text-slate-700"
        >
          {readLessLabel}
        </button>
      ) : null}
    </div>
  );
}
