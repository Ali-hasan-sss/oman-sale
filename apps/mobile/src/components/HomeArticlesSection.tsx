import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ArticleCard } from './vertex/ArticleCard';
import { SectionHeader } from './vertex/SectionHeader';
import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import { useI18n } from '../i18n';
import type { ArticleSummary } from '../services/articles.service';

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
      <SectionHeader
        title={t.articles.sectionTitle}
        subtitle={t.articles.sectionSubtitle}
        actionLabel={t.articles.viewAll}
        onAction={onBrowseNews}
      />
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} onPress={() => onOpenArticle(article.slug)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 18
  }
});
