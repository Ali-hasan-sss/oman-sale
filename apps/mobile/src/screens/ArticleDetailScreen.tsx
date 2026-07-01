import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  ArticleCommentComposer,
  ArticleCommentsDialogs,
  ArticleCommentsList,
  useArticleComments
} from '../components/articles/ArticleComments';
import { ArticleImageGallery } from '../components/articles/ArticleImageGallery';
import { ArticleReactions } from '../components/articles/ArticleReactions';
import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { KeyboardAvoidingView } from '../components/KeyboardInsets';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { fetchArticleBySlug, type ArticleDetails } from '../services/articles.service';
import { useAuthStore } from '../stores';
import { colors } from '../theme';

type ArticleDetailScreenProps = {
  slug: string;
  onLoginRequired: () => void;
};

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildArticleImages(article: ArticleDetails) {
  const images: string[] = [];
  if (article.coverImageUrl) images.push(article.coverImageUrl);
  for (const url of article.galleryImages ?? []) {
    if (url && !images.includes(url)) images.push(url);
  }
  return images;
}

export function ArticleDetailScreen({ slug, onLoginRequired }: ArticleDetailScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const text = t.articles;
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = Boolean(user);
  const { scrollBottomPadding } = useScreenInsets();
  const [article, setArticle] = useState<ArticleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const textAlign = isRtl ? styles.rtl : styles.ltr;

  const commentsState = useArticleComments({
    articleId: article?.id ?? '',
    isLoggedIn,
    onLoginRequired
  });

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    fetchArticleBySlug(slug)
      .then(setArticle)
      .catch(() => {
        setArticle(null);
        setError(true);
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const images = useMemo(() => (article ? buildArticleImages(article) : []), [article]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (!article || error) {
    return <EmptyState message={text.notFound} />;
  }

  const title = locale === 'en' ? article.titleEn : article.titleAr;
  const body = stripHtml(locale === 'en' ? article.bodyEn : article.bodyAr);

  return (
    <KeyboardAvoidingView style={styles.root} behavior="padding">
      <KeyboardAwareScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        disableKeyboardInset
        contentContainerStyle={{
          paddingBottom: scrollBottomPadding
        }}
      >
        <ArticleImageGallery images={images} />

        <View style={styles.body}>
          {article.category ? (
            <AppText style={styles.category}>
              {locale === 'en' ? article.category.nameEn : article.category.nameAr}
            </AppText>
          ) : null}
          <AppText style={[styles.title, textAlign]}>{title}</AppText>
          <AppText style={styles.meta}>
            {article.views} {text.views}
            {article.publishedAt ? ` • ${new Date(article.publishedAt).toLocaleDateString()}` : ''}
          </AppText>
          <AppText style={[styles.articleBody, textAlign]}>{body}</AppText>

          <ArticleReactions articleId={article.id} isLoggedIn={isLoggedIn} onLoginRequired={onLoginRequired} />

          <ArticleCommentsList
            articleId={article.id}
            currentUserId={user?.id}
            isLoggedIn={isLoggedIn}
            onLoginRequired={onLoginRequired}
            {...commentsState}
          />
        </View>
      </KeyboardAwareScrollView>

      <ArticleCommentComposer
        body={commentsState.body}
        setBody={commentsState.setBody}
        submit={commentsState.submit}
        submitting={commentsState.submitting}
      />

      <ArticleCommentsDialogs
        pendingDeleteId={commentsState.pendingDeleteId}
        setPendingDeleteId={commentsState.setPendingDeleteId}
        confirmDelete={commentsState.confirmDelete}
        deleting={commentsState.deleting}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    flex: 1
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 16
  },
  category: {
    color: colors.brand,
    fontWeight: '800',
    marginBottom: 8
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 34
  },
  meta: {
    marginTop: 10,
    marginBottom: 18,
    color: colors.muted
  },
  articleBody: {
    color: colors.ink,
    lineHeight: 26,
    fontSize: 16
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
