import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent
} from 'react-native';

import { AppText } from './AppText';
import { HeroBannerSkeleton } from './skeleton';
import { useI18n } from '../i18n';
import {
  getCachedHeroBanners,
  isHeroBannersLoaded,
  setCachedHeroBanners
} from '../lib/screen-data-cache';
import { fetchHeroBanners } from '../services/hero.service';
import type { HeroBanner } from '../types';
import { colors, radius, shadow } from '../theme';

const BANNER_INTERVAL_MS = 3500;
const BANNER_ASPECT = 990 / 250;

const buildLoopBanners = (banners: HeroBanner[]) => {
  if (banners.length <= 1) return banners;
  return [banners[banners.length - 1]!, ...banners, banners[0]!];
};

const loopIndexToReal = (loopIndex: number, count: number) => {
  if (count <= 1) return 0;
  if (loopIndex === 0) return count - 1;
  if (loopIndex === count + 1) return 0;
  return loopIndex - 1;
};

const normalizeExternalUrl = (url: string) => {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
};

type BannerCardProps = {
  banner: HeroBanner;
  width: number;
  height: number;
  isRtl: boolean;
  onPress: () => void;
};

function BannerCard({ banner, width, height, isRtl, onPress }: BannerCardProps) {
  const imageUri = banner.imageUrl?.trim() ?? '';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { width, height }, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.image, { width, height }]} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imageMissing, { width, height }]} />
      )}
      {banner.text ? (
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.textOverlay}>
          <AppText style={[styles.bannerText, isRtl ? styles.rtl : styles.ltr]} numberOfLines={2}>
            {banner.text}
          </AppText>
        </LinearGradient>
      ) : null}
    </Pressable>
  );
}

export function HeroBannersSection() {
  const { locale, t, isRtl } = useI18n();
  const [banners, setBanners] = useState<HeroBanner[]>(() => getCachedHeroBanners(locale));
  const [isLoading, setIsLoading] = useState(() => !isHeroBannersLoaded(locale));
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const listRef = useRef<FlatList<HeroBanner>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopIndexRef = useRef(0);
  const isAdjustingLoopRef = useRef(false);

  const bannerHeight = slideWidth > 0 ? slideWidth / BANNER_ASPECT : 0;
  const loopBanners = useMemo(() => buildLoopBanners(banners), [banners]);
  const hasLoop = banners.length > 1;

  useEffect(() => {
    let cancelled = false;
    const hadCache = isHeroBannersLoaded(locale);

    if (hadCache) {
      setBanners(getCachedHeroBanners(locale));
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    fetchHeroBanners(locale)
      .then((items) => {
        if (!cancelled) {
          setCachedHeroBanners(locale, items);
          setBanners(items);
          setActiveIndex(0);
          loopIndexRef.current = 0;
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCachedHeroBanners(locale, []);
          setBanners([]);
          setActiveIndex(0);
          loopIndexRef.current = 0;
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const openLink = (url: string) => {
    const target = normalizeExternalUrl(url);
    if (!/^https?:\/\//i.test(target)) return;
    Linking.openURL(target).catch(() => undefined);
  };

  const scrollToLoopIndex = useCallback(
    (loopIndex: number, animated: boolean) => {
      if (slideWidth <= 0) return;
      listRef.current?.scrollToOffset({ offset: loopIndex * slideWidth, animated });
      loopIndexRef.current = loopIndex;
    },
    [slideWidth]
  );

  const clearAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    clearAutoPlay();
    if (!hasLoop || slideWidth <= 0) return;

    timerRef.current = setInterval(() => {
      scrollToLoopIndex(loopIndexRef.current + 1, true);
    }, BANNER_INTERVAL_MS);
  }, [clearAutoPlay, hasLoop, scrollToLoopIndex, slideWidth]);

  useEffect(() => {
    startAutoPlay();
    return clearAutoPlay;
  }, [startAutoPlay, clearAutoPlay]);

  useEffect(() => {
    if (!hasLoop || slideWidth <= 0) return;
    scrollToLoopIndex(1, false);
    setActiveIndex(0);
  }, [hasLoop, slideWidth, scrollToLoopIndex, loopBanners.length]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== slideWidth) {
      setSlideWidth(width);
    }
  };

  const handleLoopScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0 || !hasLoop || isAdjustingLoopRef.current) return;

    const loopIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);

    if (loopIndex === 0) {
      isAdjustingLoopRef.current = true;
      scrollToLoopIndex(banners.length, false);
      setActiveIndex(banners.length - 1);
      requestAnimationFrame(() => {
        isAdjustingLoopRef.current = false;
      });
      startAutoPlay();
      return;
    }

    if (loopIndex === loopBanners.length - 1) {
      isAdjustingLoopRef.current = true;
      scrollToLoopIndex(1, false);
      setActiveIndex(0);
      requestAnimationFrame(() => {
        isAdjustingLoopRef.current = false;
      });
      startAutoPlay();
      return;
    }

    setActiveIndex(loopIndexToReal(loopIndex, banners.length));
    startAutoPlay();
  };

  const handleDotPress = (realIndex: number) => {
    if (!hasLoop) return;
    scrollToLoopIndex(realIndex + 1, true);
    setActiveIndex(realIndex);
    startAutoPlay();
  };

  if (!isLoading && banners.length === 0) return null;

  const bannerSkeletonHeight = slideWidth > 0 ? slideWidth / BANNER_ASPECT : 120;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.home.bannersTitle}</AppText>
        {t.home.bannersSubtitle ? (
          <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.home.bannersSubtitle}</AppText>
        ) : null}
      </View>

      <View style={[styles.carouselWrap, bannerHeight > 0 && { height: bannerHeight }]} onLayout={handleLayout}>
        {isLoading && !isHeroBannersLoaded(locale) && banners.length === 0 ? (
          <HeroBannerSkeleton height={bannerSkeletonHeight} />
        ) : slideWidth > 0 && bannerHeight > 0 ? (
          hasLoop ? (
            <>
              <FlatList
                ref={listRef}
                data={loopBanners}
                horizontal
                pagingEnabled
                bounces={false}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                style={styles.carouselList}
                removeClippedSubviews={false}
                initialScrollIndex={1}
                keyExtractor={(item, index) => `${item.id}-banner-${index}`}
                getItemLayout={(_, index) => ({ length: slideWidth, offset: slideWidth * index, index })}
                onMomentumScrollEnd={handleLoopScrollEnd}
                renderItem={({ item }) => (
                  <BannerCard
                    banner={item}
                    width={slideWidth}
                    height={bannerHeight}
                    isRtl={isRtl}
                    onPress={() => openLink(item.linkUrl)}
                  />
                )}
              />
              <View style={styles.dots}>
                {banners.map((banner, index) => (
                  <Pressable
                    key={banner.id}
                    accessibilityRole="button"
                    onPress={() => handleDotPress(index)}
                    style={[styles.dot, activeIndex === index ? styles.dotActive : styles.dotInactive]}
                  />
                ))}
              </View>
            </>
          ) : (
            <BannerCard
              banner={banners[0]!}
              width={slideWidth}
              height={bannerHeight}
              isRtl={isRtl}
              onPress={() => openLink(banners[0]!.linkUrl)}
            />
          )
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 4
  },
  header: {
    marginBottom: 10
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted
  },
  carouselWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow
  },
  carouselList: {
    direction: 'ltr'
  },
  placeholder: {
    aspectRatio: BANNER_ASPECT,
    backgroundColor: colors.background
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }]
  },
  image: {
    backgroundColor: colors.background
  },
  imageMissing: {
    backgroundColor: colors.line
  },
  textOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  bannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18
  },
  dots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  dot: {
    height: 6,
    borderRadius: radius.pill
  },
  dotActive: {
    width: 18,
    backgroundColor: '#fff'
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.55)'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
