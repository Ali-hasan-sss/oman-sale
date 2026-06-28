import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../AppText';
import { AppTextInput } from '../AppTextInput';
import { ConfirmDialog } from '../ConfirmDialog';
import { useComposerKeyboardLift } from '../../hooks/use-composer-keyboard-lift';
import { useI18n } from '../../i18n';
import { type ArticleComment, updateArticleComment } from '../../services/articles.service';
import { colors, radius } from '../../theme';
import { COMMENT_MAX_LENGTH, useArticleComments } from './use-article-comments';

type ArticleCommentsProps = {
  articleId: string;
  currentUserId?: string;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
};

type CommentsState = ReturnType<typeof useArticleComments>;

type ArticleCommentsListProps = ArticleCommentsProps & CommentsState;

export function ArticleCommentsList({
  currentUserId,
  isLoggedIn,
  onLoginRequired,
  comments,
  loading,
  loadingMore,
  hasMore,
  page,
  loadPage,
  updateComment,
  requestDelete,
  articleId
}: ArticleCommentsListProps) {
  const { locale, t, isRtl } = useI18n();
  const text = t.articles;
  const textAlign = isRtl ? styles.rtl : styles.ltr;

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
                cancel: text.commentCancel,
                readMore: text.commentReadMore,
                readLess: text.commentReadLess
              }}
              onUpdated={updateComment}
              onDeleteRequest={() => requestDelete(comment.id)}
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
    </View>
  );
}

type ArticleCommentComposerProps = Pick<CommentsState, 'body' | 'setBody' | 'submit' | 'submitting'>;

export function ArticleCommentComposer({ body, setBody, submit, submitting }: ArticleCommentComposerProps) {
  const { t, isRtl } = useI18n();
  const text = t.articles;
  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const safeInsets = useSafeAreaInsets();
  const composerLift = useComposerKeyboardLift();
  const composerBottomPad = Math.max(safeInsets.bottom, 8);

  return (
    <View
      style={[
        styles.composerDock,
        Platform.OS === 'ios' && composerLift > 0 ? { marginBottom: composerLift } : null,
        { paddingBottom: composerBottomPad }
      ]}
    >
      <View style={[styles.composer, isRtl && styles.composerRtl]}>
        <AppTextInput
          value={body}
          onChangeText={(value) => setBody(value.slice(0, COMMENT_MAX_LENGTH))}
          placeholder={text.commentPlaceholder}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={() => void submit()}
          blurOnSubmit={false}
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
    </View>
  );
}

type ArticleCommentsDialogsProps = Pick<
  CommentsState,
  'pendingDeleteId' | 'setPendingDeleteId' | 'confirmDelete' | 'deleting'
>;

export function ArticleCommentsDialogs({
  pendingDeleteId,
  setPendingDeleteId,
  confirmDelete,
  deleting
}: ArticleCommentsDialogsProps) {
  const { t } = useI18n();
  const text = t.articles;

  return (
    <>
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
    </>
  );
}

export { useArticleComments };

type CommentItemProps = {
  comment: ArticleComment;
  articleId: string;
  isOwner: boolean;
  locale: string;
  labels: {
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    readMore: string;
    readLess: string;
  };
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
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

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
      setExpanded(false);
      setIsTruncated(false);
    } finally {
      setSaving(false);
    }
  };

  const shouldShowToggle = isTruncated || expanded;

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
        <>
          {!expanded ? (
            <AppText
              style={styles.measureText}
              onTextLayout={(event) => setIsTruncated(event.nativeEvent.lines.length > 2)}
            >
              {comment.body}
            </AppText>
          ) : null}
          <AppText style={styles.commentBody} numberOfLines={expanded ? undefined : 2}>
            {comment.body}
          </AppText>
          {shouldShowToggle ? (
            <Pressable onPress={() => setExpanded((current) => !current)} hitSlop={8}>
              <AppText style={styles.readMore}>{expanded ? labels.readLess : labels.readMore}</AppText>
            </Pressable>
          ) : null}
        </>
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
  measureText: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
    left: 0,
    right: 0,
    lineHeight: 22
  },
  readMore: {
    marginTop: 4,
    color: colors.brandDark,
    fontWeight: '700',
    fontSize: 13
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
  composerDock: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    zIndex: 30
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10
  },
  composerRtl: {
    flexDirection: 'row-reverse'
  },
  composerInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.background
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
