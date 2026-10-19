import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import { useI18n } from '../i18n';
import type { ArticleSummary } from '../services/articles.service';
import { colors, radius, shadow } from '../theme';

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

type HomeArticlesSectionProps = {
  onOpenArticle: (slug: string) => void;
  onBrowseNews: () => void;
};

export function HomeArticlesSection({ onOpenArticle, onBrowseNews }: HomeArticlesSectionProps) {
  const { locale, t } = useI18n();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    http
      .get<ApiEnvelope<ArticleSummary[]>>(API_ENDPOINTS.articles.latest, { params: { limit: 3 } })
      .then((response) => {
        if (!cancelled) setArticles(Array.isArray(response.data.data) ? response.data.data : []);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!isLoading && articles.length === 0) return null;

  return (
    <View style={styles.section}>
      <AppText style={styles.kicker}>{t.articles.sectionLabel}</AppText>
      <AppText style={styles.title}>{t.articles.sectionTitle}</AppText>
      <AppText style={styles.subtitle}>{t.articles.sectionSubtitle}</AppText>

      {articles.map((article) => {
        const title = locale === 'en' ? article.titleEn : article.titleAr;
        const excerpt = stripHtml(locale === 'en' ? article.bodyEn : article.bodyAr);
        return (
          <Pressable key={article.id} style={styles.card} onPress={() => onOpenArticle(article.slug)}>
            {article.coverImageUrl ? (
              <Image source={{ uri: article.coverImageUrl }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverFallback]} />
            )}
            <View style={styles.body}>
              <AppText style={styles.cardTitle} numberOfLines={2}>
                {title}
              </AppText>
              {excerpt ? (
                <AppText style={styles.excerpt} numberOfLines={3}>
                  {excerpt}
                </AppText>
              ) : null}
            </View>
          </Pressable>
        );
      })}

      <Pressable style={styles.cta} onPress={onBrowseNews}>
        <AppText style={styles.ctaText}>{t.articles.viewAll}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 18
  },
  kicker: {
    color: '#168c4e',
    fontWeight: '800',
    marginBottom: 6
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: '#475569',
    lineHeight: 22
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 14,
    ...shadow
  },
  cover: {
    width: '100%',
    height: 176
  },
  coverFallback: {
    backgroundColor: '#e2e8f0'
  },
  body: {
    padding: 14
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink
  },
  excerpt: {
    marginTop: 8,
    color: '#64748b',
    lineHeight: 20
  },
  cta: {
    alignSelf: 'center',
    marginTop: 6,
    backgroundColor: '#168c4e',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12
  },
  ctaText: {
    color: '#fff',
    fontWeight: '900'
  }
});
