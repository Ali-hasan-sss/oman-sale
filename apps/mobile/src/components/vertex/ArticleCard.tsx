import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '../AppText';
import { useI18n } from '../../i18n';
import { alignSelfStart } from '../../lib/layout-direction';
import type { ArticleSummary } from '../../services/articles.service';

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const readLabel = (text: string, locale: string) => {
  const minutes = Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
  if (locale === 'en') return `${minutes} min read`;
  if (minutes === 1) return 'قراءة دقيقة';
  if (minutes === 2) return 'قراءة دقيقتين';
  if (minutes <= 10) return `قراءة ${minutes} دقائق`;
  return `قراءة ${minutes} دقيقة`;
};

type ArticleCardProps = {
  article: ArticleSummary;
  onPress: () => void;
};

/** Cover, category pill, bold title, two-line excerpt and reading time — same as the web card. */
export function ArticleCard({ article, onPress }: ArticleCardProps) {
  const { locale, isRtl } = useI18n();
  const [broken, setBroken] = useState(false);
  const title = locale === 'en' ? article.titleEn : article.titleAr;
  const excerpt = stripHtml(locale === 'en' ? article.bodyEn : article.bodyAr);
  const category = locale === 'en' ? article.category?.nameEn : article.category?.nameAr;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cover}>
        <LinearGradient colors={['#ffffff', '#dcfce7']} style={StyleSheet.absoluteFill} />
        <View style={styles.fallback}>
          <AppText style={styles.fallbackEmoji}>📰</AppText>
        </View>
        {article.coverImageUrl && !broken ? (
          <Image source={{ uri: article.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setBroken(true)} />
        ) : null}
      </View>
      <View style={styles.body}>
        {category ? (
          <View style={[styles.pill, alignSelfStart(isRtl)]}>
            <AppText style={styles.pillText}>{category}</AppText>
          </View>
        ) : null}
        <AppText style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
        {excerpt ? (
          <AppText style={styles.excerpt} numberOfLines={2}>
            {excerpt}
          </AppText>
        ) : null}
        <AppText style={styles.meta}>{readLabel(excerpt, locale)}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  pressed: {
    opacity: 0.94
  },
  cover: {
    height: 176,
    overflow: 'hidden'
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fallbackEmoji: {
    fontSize: 56,
    lineHeight: 70,
    textAlign: 'center'
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16
  },
  pill: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 8
  },
  pillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0e5630'
  },
  title: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '900',
    color: '#0f172a'
  },
  excerpt: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 23,
    color: '#475569'
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  }
});
