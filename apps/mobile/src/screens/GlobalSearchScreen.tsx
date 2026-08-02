import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { ListingCard } from '../components/ListingCard';
import { ListingListSkeleton } from '../components/skeleton';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { getCityLabel } from '../lib/oman-cities';
import { fetchArticles, type ArticleSummary } from '../services/articles.service';
import { fetchCategories, fetchFilteredListings, type CategoryOption } from '../services/listings.service';
import {
  fetchSearchSuggestions,
  type SearchSuggestion,
  type SearchSuggestionType
} from '../services/search.service';
import { fetchPublicStores, type PublicStore } from '../services/stores.service';
import type { Listing } from '../types';
import { colors, radius, shadow } from '../theme';

const fallbackLogo = require('../../assets/nav-logo.png');
const RESULT_LIMIT = 8;
const MIN_SUGGESTIONS_LENGTH = 1;
const SUGGESTIONS_DEBOUNCE_MS = 300;

type GlobalSearchScreenProps = {
  onListingPress: (listingId: string) => void;
  onStorePress: (slug: string) => void;
  onCategoryPress: (categoryId: string) => void;
  onArticlePress: (slug: string) => void;
  onBrowseOffers: () => void;
  onBrowseStores: () => void;
  onBrowseNews: () => void;
};

export function GlobalSearchScreen({
  onListingPress,
  onStorePress,
  onCategoryPress,
  onArticlePress,
  onBrowseOffers,
  onBrowseStores,
  onBrowseNews
}: GlobalSearchScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const text = t.globalSearch;
  const { scrollBottomPadding } = useScreenInsets();
  const textAlign = isRtl ? styles.rtl : styles.ltr;

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestionsAbortRef = useRef<AbortController | null>(null);

  const trimmedInput = searchInput.trim();
  const showSuggestions = suggestionsOpen && trimmedInput.length >= MIN_SUGGESTIONS_LENGTH;

  const suggestionTypeLabels: Record<Exclude<SearchSuggestionType, 'tourism'>, string> = {
    listing: text.suggestionListing,
    category: text.suggestionCategory,
    article: text.suggestionArticle,
    store: text.suggestionStore
  };

  useEffect(() => {
    fetchCategories(locale)
      .then((items) => setCategories(Array.isArray(items) ? items : []))
      .catch(() => setCategories([]));
  }, [locale]);

  useEffect(() => {
    if (!showSuggestions) {
      suggestionsAbortRef.current?.abort();
      suggestionsAbortRef.current = null;
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    suggestionsAbortRef.current = controller;
    const timer = setTimeout(() => {
      setLoadingSuggestions(true);
      fetchSearchSuggestions({ q: trimmedInput, locale, limit: 5 })
        .then((items) => {
          if (controller.signal.aborted) return;
          setSuggestions(items.filter((item) => item.type !== 'tourism'));
        })
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingSuggestions(false);
        });
    }, SUGGESTIONS_DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [locale, showSuggestions, trimmedInput]);

  const matchedCategories = useMemo(() => {
    if (!query) return [];
    const term = query.toLowerCase();
    return categories.filter((category) => {
      const name = (locale === 'en' ? category.nameEn : category.nameAr) ?? category.name;
      return name.toLowerCase().includes(term) || (category.slug ?? '').toLowerCase().includes(term);
    });
  }, [categories, locale, query]);

  const loadResults = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setListings([]);
      setStores([]);
      setArticles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [listingsResult, storesResult, articlesResult] = await Promise.all([
        fetchFilteredListings({ q: trimmed, page: 1, limit: RESULT_LIMIT }),
        fetchPublicStores({ q: trimmed, page: 1, limit: RESULT_LIMIT }),
        fetchArticles({ q: trimmed, page: 1, limit: RESULT_LIMIT })
      ]);
      setListings(listingsResult.items);
      setStores(storesResult.items);
      setArticles(articlesResult.items);
    } catch {
      setListings([]);
      setStores([]);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults(query).catch(() => undefined);
  }, [loadResults, query]);

  const submitSearch = () => {
    setSuggestionsOpen(false);
    setQuery(trimmedInput);
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    setSuggestionsOpen(false);
    setSearchInput(suggestion.label);
    setQuery(suggestion.label);

    switch (suggestion.type) {
      case 'listing':
        onListingPress(suggestion.id);
        break;
      case 'category':
        onCategoryPress(suggestion.id);
        break;
      case 'store':
        if (suggestion.slug) onStorePress(suggestion.slug);
        break;
      case 'article':
        if (suggestion.slug) onArticlePress(suggestion.slug);
        break;
      default:
        break;
    }
  };

  const hasResults =
    matchedCategories.length > 0 || listings.length > 0 || stores.length > 0 || articles.length > 0;

  const localizedArticleTitle = (article: ArticleSummary) =>
    locale === 'en' ? article.titleEn : article.titleAr;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={() => setSuggestionsOpen(false)}
      refreshControl={
        query ? (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadResults(query).catch(() => undefined)}
            colors={[colors.brand]}
            tintColor={colors.brand}
          />
        ) : undefined
      }
    >
      <AppText style={[styles.title, textAlign]}>{text.title}</AppText>
      <AppText style={[styles.hint, textAlign]}>{text.hint}</AppText>

      <View style={styles.searchBox}>
        <AppTextInput
          value={searchInput}
          onChangeText={(value) => {
            setSearchInput(value);
            setSuggestionsOpen(true);
          }}
          onFocus={() => setSuggestionsOpen(true)}
          placeholder={text.placeholder}
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          onSubmitEditing={submitSearch}
          style={[styles.searchInput, isRtl ? styles.inputRtl : styles.inputLtr]}
        />
        <Pressable style={styles.searchButton} onPress={submitSearch}>
          <AppText style={styles.searchButtonText}>{text.search}</AppText>
        </Pressable>

        {showSuggestions ? (
          <View style={styles.suggestionsPanel}>
            {loadingSuggestions ? (
              <View style={styles.suggestionsLoading}>
                <ActivityIndicator color={colors.brand} size="small" />
                <AppText style={[styles.suggestionsLoadingText, textAlign]}>{text.suggestionsLoading}</AppText>
              </View>
            ) : suggestions.length === 0 ? (
              <AppText style={[styles.suggestionsEmpty, textAlign]}>{text.suggestionsEmpty}</AppText>
            ) : (
              suggestions.map((suggestion, index) => {
                if (suggestion.type === 'tourism') return null;
                const typeLabel = suggestionTypeLabels[suggestion.type];
                return (
                  <Pressable
                    key={`${suggestion.type}-${suggestion.id}`}
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      index > 0 && styles.suggestionRowBorder,
                      pressed && styles.chipPressed
                    ]}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <View style={styles.suggestionBadge}>
                      <AppText style={styles.suggestionBadgeText}>{typeLabel}</AppText>
                    </View>
                    <AppText style={[styles.suggestionLabel, textAlign]} numberOfLines={1}>
                      {suggestion.label}
                    </AppText>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : null}
      </View>

      {!query ? null : (
        <AppText style={[styles.queryLabel, textAlign]}>
          {text.queryLabel}: <AppText style={styles.queryValue}>&quot;{query}&quot;</AppText>
        </AppText>
      )}

      {query && isLoading ? <ListingListSkeleton count={3} /> : null}

      {query && !isLoading && !hasResults ? (
        <AppText style={[styles.empty, textAlign]}>{text.empty}</AppText>
      ) : null}

      {query && !isLoading && matchedCategories.length > 0 ? (
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, textAlign]}>{text.categories}</AppText>
          <View style={styles.chipsWrap}>
            {matchedCategories.slice(0, 12).map((category) => (
              <Pressable
                key={category.id}
                style={({ pressed }) => [styles.categoryChip, pressed && styles.chipPressed]}
                onPress={() => onCategoryPress(category.id)}
              >
                <AppText style={styles.categoryChipText} numberOfLines={1}>
                  {(locale === 'en' ? category.nameEn : category.nameAr) ?? category.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {query && !isLoading && listings.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={[styles.sectionTitle, textAlign]}>{text.listings}</AppText>
            <Pressable onPress={onBrowseOffers}>
              <AppText style={styles.viewAll}>{text.viewAll}</AppText>
            </Pressable>
          </View>
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
              featuredLabel={t.common.featured}
              onPress={() => onListingPress(listing.id)}
              onStorePress={onStorePress}
            />
          ))}
        </View>
      ) : null}

      {query && !isLoading && articles.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={[styles.sectionTitle, textAlign]}>{text.articles}</AppText>
            <Pressable onPress={onBrowseNews}>
              <AppText style={styles.viewAll}>{text.viewAll}</AppText>
            </Pressable>
          </View>
          {articles.map((article) => (
            <Pressable
              key={article.id}
              style={({ pressed }) => [styles.articleCard, pressed && styles.chipPressed]}
              onPress={() => onArticlePress(article.slug)}
            >
              {article.coverImageUrl ? (
                <Image source={{ uri: article.coverImageUrl }} style={styles.articleCover} />
              ) : (
                <View style={styles.articleCoverFallback}>
                  <Image source={fallbackLogo} style={styles.articleCoverLogo} resizeMode="contain" />
                </View>
              )}
              <View style={styles.articleBody}>
                <AppText style={[styles.articleTitle, textAlign]} numberOfLines={2}>
                  {localizedArticleTitle(article)}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {query && !isLoading && stores.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={[styles.sectionTitle, textAlign]}>{text.stores}</AppText>
            <Pressable onPress={onBrowseStores}>
              <AppText style={styles.viewAll}>{text.viewAll}</AppText>
            </Pressable>
          </View>
          {stores.map((store) => {
            const name = locale === 'en' ? store.nameEn : store.nameAr;
            const bio = locale === 'en' ? store.bioEn : store.bioAr;
            const cityLabel = getCityLabel(store.city ?? '', locale);
            return (
              <Pressable
                key={store.id}
                style={({ pressed }) => [styles.storeCard, pressed && styles.chipPressed]}
                onPress={() => onStorePress(store.slug)}
              >
                {store.coverUrl ? (
                  <Image source={{ uri: store.coverUrl }} style={styles.storeCover} />
                ) : (
                  <View style={styles.storeCoverFallback}>
                    <Image source={fallbackLogo} style={styles.storeCoverLogo} resizeMode="contain" />
                  </View>
                )}
                <View style={styles.storeBody}>
                  <AppText style={[styles.storeName, textAlign]} numberOfLines={1}>
                    {name}
                  </AppText>
                  {bio ? (
                    <AppText style={[styles.storeBio, textAlign]} numberOfLines={2}>
                      {bio}
                    </AppText>
                  ) : null}
                  <AppText style={[styles.storeMeta, textAlign]}>
                    {store.listingsCount ?? 0} {t.storesBrowse.listings}
                    {cityLabel ? ` · ${cityLabel}` : ''}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  hint: {
    color: colors.muted,
    lineHeight: 22
  },
  searchBox: {
    gap: 10,
    zIndex: 20
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface
  },
  searchButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '800'
  },
  suggestionsPanel: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow
  },
  suggestionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 14
  },
  suggestionsLoadingText: {
    color: colors.muted,
    fontSize: 13
  },
  suggestionsEmpty: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 18,
    paddingHorizontal: 14
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  suggestionRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  suggestionBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  suggestionBadgeText: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: '800'
  },
  suggestionLabel: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600'
  },
  queryLabel: {
    color: colors.muted,
    fontSize: 14
  },
  queryValue: {
    color: colors.ink,
    fontWeight: '800'
  },
  empty: {
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 24
  },
  section: {
    gap: 10
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink
  },
  viewAll: {
    color: colors.brand,
    fontWeight: '800',
    fontSize: 13
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  categoryChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: '100%'
  },
  categoryChipText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 13
  },
  chipPressed: {
    opacity: 0.9
  },
  articleCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...shadow
  },
  articleCover: {
    width: '100%',
    height: 140
  },
  articleCoverFallback: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft
  },
  articleCoverLogo: {
    width: 56,
    height: 56,
    opacity: 0.5
  },
  articleBody: {
    padding: 12
  },
  articleTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22
  },
  storeCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...shadow
  },
  storeCover: {
    width: '100%',
    height: 96
  },
  storeCoverFallback: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft
  },
  storeCoverLogo: {
    width: 56,
    height: 56,
    opacity: 0.5
  },
  storeBody: {
    padding: 12,
    gap: 4
  },
  storeName: {
    fontWeight: '900',
    color: colors.ink,
    fontSize: 16
  },
  storeBio: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  storeMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600'
  },
  rtl: { textAlign: 'right' },
  ltr: { textAlign: 'left' },
  inputRtl: { textAlign: 'right' },
  inputLtr: { textAlign: 'left' }
});
