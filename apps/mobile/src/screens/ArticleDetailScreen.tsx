import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';

import { ArticleComments } from '../components/articles/ArticleComments';
import { ArticleReactions } from '../components/articles/ArticleReactions';
import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
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
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
      {article.coverImageUrl ? (
        <Image source={{ uri: article.coverImageUrl }} style={styles.cover} resizeMode="cover" />
      ) : null}
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
      <AppText style={[styles.body, textAlign]}>{body}</AppText>
      {article.galleryImages?.length ? (
        <View style={styles.gallery}>
          {article.galleryImages.map((imageUrl) => (
            <Image key={imageUrl} source={{ uri: imageUrl }} style={styles.galleryImage} resizeMode="cover" />
          ))}
        </View>
      ) : null}

      <ArticleReactions articleId={article.id} isLoggedIn={isLoggedIn} onLoginRequired={onLoginRequired} />

      <ArticleComments
        articleId={article.id}
        currentUserId={user?.id}
        isLoggedIn={isLoggedIn}
        onLoginRequired={onLoginRequired}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8
  },
  cover: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginBottom: 16
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
  body: {
    color: colors.ink,
    lineHeight: 26,
    fontSize: 16
  },
  gallery: {
    marginTop: 20,
    gap: 12
  },
  galleryImage: {
    width: '100%',
    height: 200,
    borderRadius: 16
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
