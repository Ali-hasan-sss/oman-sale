import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { LandmarkCard } from '../components/vertex/LandmarkCard';
import { usePreservedScroll } from '../hooks/use-preserved-scroll';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { fetchTourismDestinations, type TourismDestination } from '../services/tourism.service';
import { colors } from '../theme';

type LandmarksScreenProps = {
  onOpenLandmark: (idOrSlug: string) => void;
};

export function LandmarksScreen({ onOpenLandmark }: LandmarksScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const text = t.landmark;
  const { scrollBottomPadding } = useScreenInsets();
  const preservedScroll = usePreservedScroll('landmarks');
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(width - 32, 0);
  const [destinations, setDestinations] = useState<TourismDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const textAlign = isRtl ? styles.rtl : styles.ltr;

  const load = useCallback(async () => {
    setHasError(false);
    try {
      setDestinations(await fetchTourismDestinations());
    } catch {
      setDestinations([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView
      ref={preservedScroll.ref}
      contentOffset={preservedScroll.contentOffset}
      onLayout={preservedScroll.onLayout}
      onScroll={preservedScroll.onScroll}
      onContentSizeChange={preservedScroll.onContentSizeChange}
      scrollEventThrottle={preservedScroll.scrollEventThrottle}
      style={preservedScroll.hiddenStyle}
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            void load();
          }}
        />
      }
    >
      <AppText style={[styles.title, textAlign]}>{text.listTitle}</AppText>
      <AppText style={[styles.subtitle, textAlign]}>{text.listSubtitle}</AppText>

      {isLoading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : hasError ? (
        <Pressable onPress={() => void load()} style={styles.retry}>
          <AppText style={styles.retryText}>{text.loadError}</AppText>
        </Pressable>
      ) : destinations.length === 0 ? (
        <EmptyState message={text.empty} />
      ) : (
        <View style={styles.list}>
          {destinations.map((destination, index) => (
            <LandmarkCard
              key={destination.id}
              index={index}
              width={cardWidth}
              image={destination.imageUrl}
              title={locale === 'en' ? destination.titleEn : destination.titleAr}
              place={(locale === 'en' ? destination.addressEn : destination.addressAr) || undefined}
              description={
                (locale === 'en' ? destination.aboutEn : destination.aboutAr) ||
                (locale === 'en' ? destination.bestTimeEn : destination.bestTimeAr) ||
                undefined
              }
              onPress={() => onOpenLandmark(destination.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 16
  },
  list: {
    gap: 12
  },
  loader: {
    marginTop: 32
  },
  retry: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 28
  },
  retryText: {
    color: colors.brandDark,
    fontWeight: '800'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
