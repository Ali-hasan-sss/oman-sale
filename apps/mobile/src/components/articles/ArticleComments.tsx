import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View
} from 'react-native';

import { AppText } from '../AppText';
import { AppTextInput } from '../AppTextInput';
import { ConfirmDialog } from '../ConfirmDialog';
import { useI18n } from '../../i18n';
import {
  createArticleComment,
  deleteArticleComment,
  fetchArticleComments,
  updateArticleComment,
  type ArticleComment
} from '../../services/articles.service';
import { colors, radius } from '../../theme';

const PAGE_SIZE = 10;
const COMMENT_MAX_LENGTH = 500;

type ArticleCommentsProps = {
  articleId: string;
  currentUserId?: string;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
};

export function ArticleComments({ articleId, currentUserId, isLoggedIn, onLoginRequired }: ArticleCommentsProps) {
  const { locale, t, isRtl } = useI18n();
  const text = t.articles;
  const textAlign = isRtl ? styles.rtl : styles.ltr;

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
    void loadPage(1, false);
  }, [loadPage]);

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

  return (
    <View style={styles.section}>
      <AppText style={[styles.title, textAlign]}>{text.commentsTitle}</AppText>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : comments.length === 0 ? (
        <AppText style={[styles.empty, textAlign]}>{text.commentsEmpty}</AppText>
      ) : (
        <>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
              isOwner={currentUserId === comment.user.id}
              locale={locale}
              labels={{
                edit: text.commentEdit,
                delete: text.commentDelete,
                save: text.commentSave,
                cancel: text.commentCancel
              }}
              onUpdated={(updated) => {
                setComments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
              }}
              onDeleteRequest={() => {
                if (!isLoggedIn) {
                  onLoginRequired();
                  return;
                }
                setPendingDeleteId(comment.id);
              }}
              onLoginRequired={onLoginRequired}
              isLoggedIn={isLoggedIn}
            />
          ))}
          {hasMore ? (
            <Pressable
              style={styles.loadMoreButton}
              onPress={() => void loadPage(page + 1, true)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color={colors.brand} />
              ) : (
                <AppText style={styles.loadMoreText}>{text.commentsLoadMore}</AppText>
              )}
            </Pressable>
          ) : null}
        </>
      )}

      <View style={styles.composer}>
        <AppTextInput
          value={body}
          onChangeText={(value) => setBody(value.slice(0, COMMENT_MAX_LENGTH))}
          placeholder={text.commentPlaceholder}
          multiline
          style={[styles.composerInput, textAlign]}
        />
        <Pressable
          style={[styles.sendButton, (!body.trim() || submitting) && styles.sendButtonDisabled]}
          onPress={() => void submit()}
          disabled={submitting || !body.trim()}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>

      <ConfirmDialog
        visible={Boolean(pendingDeleteId)}
        title={text.commentDeleteTitle}
        message={text.commentDeleteConfirm}
        confirmLabel={text.commentDelete}
        cancelLabel={text.commentCancel}
        destructive
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => void confirmDelete()}
      />
      {deleting ? <ActivityIndicator color={colors.danger} style={styles.loader} /> : null}
    </View>
  );
}

type CommentItemProps = {
  comment: ArticleComment;
  articleId: string;
  isOwner: boolean;
  locale: string;
  labels: { edit: string; delete: string; save: string; cancel: string };
  onUpdated: (comment: ArticleComment) => void;
  onDeleteRequest: () => void;
  onLoginRequired: () => void;
  isLoggedIn: boolean;
};

function CommentItem({
  comment,
  articleId,
  isOwner,
  locale,
  labels,
  onUpdated,
  onDeleteRequest,
  onLoginRequired,
  isLoggedIn
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const updated = await updateArticleComment(articleId, comment.id, trimmed);
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        {comment.user.avatar ? (
          <Image source={{ uri: comment.user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <AppText style={styles.avatarInitial}>{comment.user.fullName.slice(0, 1).toUpperCase()}</AppText>
          </View>
        )}
        <View style={styles.commentMeta}>
          <AppText style={styles.commentAuthor}>{comment.user.fullName}</AppText>
          <AppText style={styles.commentDate}>
            {new Date(comment.createdAt).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
          </AppText>
        </View>
      </View>

      {editing ? (
        <>
          <AppTextInput value={draft} onChangeText={setDraft} multiline style={styles.editInput} />
          <View style={styles.commentActions}>
            <Pressable style={styles.actionButton} onPress={() => setEditing(false)}>
              <AppText style={styles.actionCancel}>{labels.cancel}</AppText>
            </Pressable>
            <Pressable style={styles.actionButtonPrimary} onPress={() => void save()} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <AppText style={styles.actionSave}>{labels.save}</AppText>
              )}
            </Pressable>
          </View>
        </>
      ) : (
        <AppText style={styles.commentBody}>{comment.body}</AppText>
      )}

      {isOwner && !editing ? (
        <View style={styles.commentActions}>
          <Pressable style={styles.actionButton} onPress={() => setEditing(true)}>
            <AppText style={styles.actionEdit}>{labels.edit}</AppText>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={onDeleteRequest}>
            <AppText style={styles.actionDelete}>{labels.delete}</AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 12
  },
  loader: {
    marginVertical: 16
  },
  empty: {
    color: colors.muted,
    marginBottom: 12
  },
  commentCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 10
  },
  commentHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontWeight: '900',
    color: colors.brandDark
  },
  commentMeta: {
    flex: 1
  },
  commentAuthor: {
    fontWeight: '800',
    color: colors.ink
  },
  commentDate: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2
  },
  commentBody: {
    color: colors.ink,
    lineHeight: 22
  },
  editInput: {
    marginBottom: 8
  },
  commentActions: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 10
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line
  },
  actionButtonPrimary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.brand,
    minWidth: 72,
    alignItems: 'center'
  },
  actionEdit: {
    color: colors.brandDark,
    fontWeight: '700'
  },
  actionDelete: {
    color: colors.danger,
    fontWeight: '700'
  },
  actionCancel: {
    color: colors.muted,
    fontWeight: '700'
  },
  actionSave: {
    color: '#fff',
    fontWeight: '700'
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginVertical: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brand
  },
  loadMoreText: {
    color: colors.brandDark,
    fontWeight: '800'
  },
  composer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 8,
    backgroundColor: colors.surface
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
