import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { EmptyState } from '../components/EmptyState';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import {
  fetchArticleCategories,
  fetchArticles,
  type ArticleCategory,
  type ArticleSummary
} from '../services/articles.service';
import { colors, radius, shadow } from '../theme';

type NewsScreenProps = {
  onOpenArticle: (slug: string) => void;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function NewsScreen({ onOpenArticle }: NewsScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const text = t.articles;
  const { scrollBottomPadding } = useScreenInsets();
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasMore = articles.length < total;
  const textAlign = isRtl ? styles.rtl : styles.ltr;

  const loadArticles = useCallback(
    async (nextPage: number, append: boolean) => {
      if (nextPage === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      try {
        const result = await fetchArticles({
          page: nextPage,
          limit: 20,
          q: search || undefined,
          categorySlug: categorySlug || undefined
        });
        setArticles((current) => (append ? [...current, ...result.items] : result.items));
        setTotal(result.total);
        setPage(nextPage);
      } catch {
        if (!append) {
          setArticles([]);
          setTotal(0);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [categorySlug, search]
  );

  useEffect(() => {
    fetchArticleCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    void loadArticles(1, false);
  }, [loadArticles]);

  const localizedTitle = (article: ArticleSummary) => (locale === 'en' ? article.titleEn : article.titleAr);
  const localizedExcerpt = (article: ArticleSummary) =>
    stripHtml(locale === 'en' ? article.bodyEn : article.bodyAr).slice(0, 140);

  return (
    <FlatList
      data={articles}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            void loadArticles(1, false);
          }}
        />
      }
      onEndReached={() => {
        if (!isLoadingMore && hasMore) void loadArticles(page + 1, true);
      }}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <View>
          <AppText style={[styles.title, textAlign]}>{text.pageTitle}</AppText>
          <AppText style={[styles.subtitle, textAlign]}>{text.pageSubtitle}</AppText>

          <View style={styles.searchRow}>
            <AppTextInput
              value={query}
              onChangeText={setQuery}
              placeholder={text.searchPlaceholder}
              style={[styles.searchInput, textAlign]}
              onSubmitEditing={() => setSearch(query.trim())}
            />
            <Pressable style={styles.searchButton} onPress={() => setSearch(query.trim())}>
              <AppText style={styles.searchButtonText}>{text.searchButton}</AppText>
            </Pressable>
          </View>

          <View style={styles.chips}>
            <Pressable
              style={[styles.chip, !categorySlug && styles.chipActive]}
              onPress={() => setCategorySlug('')}
            >
              <AppText style={[styles.chipText, !categorySlug && styles.chipTextActive]}>{text.allCategories}</AppText>
            </Pressable>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                style={[styles.chip, categorySlug === category.slug && styles.chipActive]}
                onPress={() => setCategorySlug(category.slug)}
              >
                <AppText style={[styles.chipText, categorySlug === category.slug && styles.chipTextActive]}>
                  {locale === 'en' ? category.nameEn : category.nameAr}
                </AppText>
              </Pressable>
            ))}
          </View>

          {isLoading ? <ActivityIndicator style={styles.loader} color={colors.brand} /> : null}
        </View>
      }
      ListEmptyComponent={
        !isLoading ? <EmptyState message={search || categorySlug ? text.emptySearch : text.empty} /> : null
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => onOpenArticle(item.slug)}>
          {item.coverImageUrl ? (
            <Image source={{ uri: item.coverImageUrl }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]} />
          )}
          <View style={styles.cardBody}>
            {item.category ? (
              <AppText style={styles.category}>
                {locale === 'en' ? item.category.nameEn : item.category.nameAr}
              </AppText>
            ) : null}
            <AppText style={[styles.cardTitle, textAlign]} numberOfLines={2}>
              {localizedTitle(item)}
            </AppText>
            <AppText style={[styles.excerpt, textAlign]} numberOfLines={3}>
              {localizedExcerpt(item)}
            </AppText>
            <AppText style={styles.meta}>
              {item.views} {text.views}
              {item.publishedAt ? ` • ${new Date(item.publishedAt).toLocaleDateString()}` : ''}
            </AppText>
          </View>
        </Pressable>
      )}
      ListFooterComponent={
        isLoadingMore ? <ActivityIndicator style={styles.loader} color={colors.brand} /> : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 8
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: colors.muted,
    lineHeight: 22
  },
  searchRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12
  },
  searchInput: {
    flex: 1
  },
  searchButton: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '800'
  },
  chips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface
  },
  chipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft
  },
  chipText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12
  },
  chipTextActive: {
    color: colors.brandDark
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: 14,
    ...shadow
  },
  cover: {
    width: '100%',
    height: 180
  },
  coverPlaceholder: {
    backgroundColor: '#e5e7eb'
  },
  cardBody: {
    padding: 14
  },
  category: {
    color: colors.brand,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 6
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink
  },
  excerpt: {
    marginTop: 8,
    color: colors.muted,
    lineHeight: 20
  },
  meta: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 12
  },
  loader: {
    marginVertical: 20
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
