import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { ListingCoverImage } from '../ListingCoverImage';
import type { AssistantArticleCard } from '../../types/assistant';
import type { Locale } from '../../types';
import { colors, radius } from '../../theme';

type AssistantArticleCarouselProps = {
  articles: AssistantArticleCard[];
  locale: Locale;
  viewsLabel: string;
  readLabel: string;
  onArticlePress: (slug: string) => void;
};

export function AssistantArticleCarousel({
  articles,
  locale,
  viewsLabel,
  readLabel,
  onArticlePress
}: AssistantArticleCarouselProps) {
  if (articles.length === 0) return null;

  const rtl = locale === 'ar';

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {articles.map((article) => (
        <View key={article.id} style={styles.card}>
          <View style={styles.imageWrap}>
            <ListingCoverImage uri={article.coverImageUrl || undefined} variant="card" style={styles.image} />
            {article.categoryName ? (
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>{article.categoryName}</AppText>
              </View>
            ) : null}
          </View>
          <View style={styles.body}>
            <AppText style={[styles.title, rtl ? styles.rtl : styles.ltr]} numberOfLines={2}>
              {article.title}
            </AppText>
            {article.excerpt ? (
              <AppText style={[styles.excerpt, rtl ? styles.rtl : styles.ltr]} numberOfLines={3}>
                {article.excerpt}
              </AppText>
            ) : null}
            <AppText style={[styles.meta, rtl ? styles.rtl : styles.ltr]}>
              {article.views} {viewsLabel}
            </AppText>
            <Pressable style={styles.button} onPress={() => onArticlePress(article.slug)}>
              <AppText style={styles.buttonText}>{readLabel}</AppText>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    paddingVertical: 2
  },
  card: {
    width: 168,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8'
  },
  imageWrap: {
    height: 96,
    backgroundColor: '#F5F5F5'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  badgeText: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '800'
  },
  body: {
    padding: 10
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brandDark,
    marginBottom: 4
  },
  excerpt: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 6
  },
  meta: {
    fontSize: 11,
    color: '#9A9A9A',
    marginBottom: 8
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
