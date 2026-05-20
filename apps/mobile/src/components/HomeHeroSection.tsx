import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  InteractionManager,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent
} from 'react-native';

import { AppText } from './AppText';
import { HomeHeroSkeleton } from './skeleton';
import { useI18n } from '../i18n';
import {
  getCachedHeroSlides,
  isHeroSlidesLoaded,
  setCachedHeroSlides
} from '../lib/screen-data-cache';
import { fetchHeroSlides } from '../services/hero.service';
import type { HeroSlide } from '../types';
import { colors, radius, shadow } from '../theme';

type HomeHeroSectionProps = {
  onBrowseOffers: () => void;
};

const SLIDE_INTERVAL_MS = 3000;
const HERO_HEIGHT = 220;
const HERO_OVERLAY: [string, string] = ['rgba(15,159,103,0.45)', 'rgba(8,122,80,0.55)'];

const resolveHeroAction = (link: string, onBrowseOffers: () => void) => {
  if (/^https?:\/\//i.test(link)) {
    Linking.openURL(link).catch(() => undefined);
    return;
  }

  const path = link.replace(/^\//, '').toLowerCase();
  if (path === 'all-listings' || path === 'offers') {
    onBrowseOffers();
  }
};

const buildLoopSlides = (slides: HeroSlide[]) => {
  if (slides.length <= 1) return slides;
  return [slides[slides.length - 1]!, ...slides, slides[0]!];
};

const loopIndexToReal = (loopIndex: number, slideCount: number) => {
  if (slideCount <= 1) return 0;
  if (loopIndex === 0) return slideCount - 1;
  if (loopIndex === slideCount + 1) return 0;
  return loopIndex - 1;
};

type HeroSlideCardProps = {
  slide: HeroSlide;
  width: number;
  isRtl: boolean;
  isCarousel?: boolean;
  onBrowseOffers: () => void;
};

function HeroSlideCard({ slide, width, isRtl, isCarousel, onBrowseOffers }: HeroSlideCardProps) {
  const content = (
    <>
      <AppText style={[styles.heroTitle, isRtl ? styles.rtl : styles.ltr]} numberOfLines={2}>
        {slide.title}
      </AppText>
      <AppText style={[styles.heroSubtitle, isRtl ? styles.rtl : styles.ltr]} numberOfLines={3}>
        {slide.subtitle}
      </AppText>
      <Pressable
        style={[styles.heroButton, isRtl ? styles.heroButtonRtl : styles.heroButtonLtr]}
        onPress={() => resolveHeroAction(slide.buttonLink, onBrowseOffers)}
      >
        <AppText style={styles.heroButtonText}>{slide.buttonLabel}</AppText>
      </Pressable>
    </>
  );

  if (slide.imageUrl) {
    return (
      <View style={[styles.slide, { width }]}>
        <ImageBackground
          source={{ uri: slide.imageUrl }}
          style={styles.heroImage}
          imageStyle={styles.heroImageFill}
          resizeMode="cover"
        >
          <LinearGradient colors={HERO_OVERLAY} style={[styles.heroOverlay, isCarousel && styles.heroOverlayCarousel]}>
            {content}
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={[styles.slide, { width }]}>
      <LinearGradient colors={[colors.brand, colors.brandDark]} style={[styles.heroFill, isCarousel && styles.heroOverlayCarousel]}>
        {content}
      </LinearGradient>
    </View>
  );
}

export function HomeHeroSection({ onBrowseOffers }: HomeHeroSectionProps) {
  const { locale, t, isRtl } = useI18n();
  const [slides, setSlides] = useState<HeroSlide[]>(() => getCachedHeroSlides(locale));
  const [isLoadingApi, setIsLoadingApi] = useState(() => !isHeroSlidesLoaded(locale));
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const listRef = useRef<FlatList<HeroSlide>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopIndexRef = useRef(0);
  const isAdjustingLoopRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const hadCache = isHeroSlidesLoaded(locale);

    if (hadCache) {
      setSlides(getCachedHeroSlides(locale));
      setIsLoadingApi(false);
    } else {
      setIsLoadingApi(true);
    }

    fetchHeroSlides(locale, 'mobile')
      .then((items) => {
        if (!cancelled) {
          const filtered = items.filter((item) => item.platform !== 'WEB');
          setCachedHeroSlides(locale, filtered);
          setSlides(filtered);
          setActiveIndex(0);
          loopIndexRef.current = 0;
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCachedHeroSlides(locale, []);
          setSlides([]);
          setActiveIndex(0);
          loopIndexRef.current = 0;
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingApi(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const fallbackSlides: HeroSlide[] = [
    {
      id: 'fallback',
      sortOrder: 0,
      imageUrl: '',
      title: t.home.headline,
      subtitle: t.home.subtitle,
      buttonLabel: t.home.cta,
      buttonLink: '/all-listings'
    }
  ];

  const displaySlides = slides.length > 0 ? slides : fallbackSlides;
  const loopSlides = useMemo(() => buildLoopSlides(displaySlides), [displaySlides]);
  const hasLoop = displaySlides.length > 1;

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

  const lastRealLoopIndex = displaySlides.length;

  const advanceAutoPlay = useCallback(() => {
    const current = loopIndexRef.current;
    if (current >= lastRealLoopIndex) {
      scrollToLoopIndex(1, false);
      setActiveIndex(0);
      return;
    }
    scrollToLoopIndex(current + 1, true);
  }, [lastRealLoopIndex, scrollToLoopIndex]);

  const startAutoPlay = useCallback(() => {
    clearAutoPlay();
    if (!hasLoop || slideWidth <= 0) return;

    timerRef.current = setInterval(() => {
      advanceAutoPlay();
    }, SLIDE_INTERVAL_MS);
  }, [advanceAutoPlay, clearAutoPlay, hasLoop, slideWidth]);

  const finishLoopJump = useCallback(
    (onDone: () => void) => {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          onDone();
          requestAnimationFrame(() => {
            isAdjustingLoopRef.current = false;
            startAutoPlay();
          });
        });
      });
    },
    [startAutoPlay]
  );

  useEffect(() => {
    startAutoPlay();
    return clearAutoPlay;
  }, [startAutoPlay, clearAutoPlay]);

  useEffect(() => {
    if (!hasLoop || slideWidth <= 0) return;
    scrollToLoopIndex(1, false);
    setActiveIndex(0);
  }, [hasLoop, slideWidth, scrollToLoopIndex, loopSlides.length]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== slideWidth) {
      setSlideWidth(width);
    }
  };

  const handleLoopScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0 || isAdjustingLoopRef.current) return;
    loopIndexRef.current = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
  };

  const handleLoopScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0 || !hasLoop || isAdjustingLoopRef.current) return;

    const loopIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    const cloneEndIndex = loopSlides.length - 1;

    if (loopIndex === 0) {
      isAdjustingLoopRef.current = true;
      clearAutoPlay();
      scrollToLoopIndex(lastRealLoopIndex, false);
      setActiveIndex(displaySlides.length - 1);
      finishLoopJump(() => undefined);
      return;
    }

    if (loopIndex === cloneEndIndex) {
      isAdjustingLoopRef.current = true;
      clearAutoPlay();
      scrollToLoopIndex(1, false);
      setActiveIndex(0);
      finishLoopJump(() => undefined);
      return;
    }

    loopIndexRef.current = loopIndex;
    setActiveIndex(loopIndexToReal(loopIndex, displaySlides.length));
    startAutoPlay();
  };

  const handleDotPress = (realIndex: number) => {
    if (!hasLoop) return;
    scrollToLoopIndex(realIndex + 1, true);
    setActiveIndex(realIndex);
    startAutoPlay();
  };

  if (isLoadingApi && !isHeroSlidesLoaded(locale) && slides.length === 0) {
    return (
      <View style={styles.wrapper} onLayout={handleLayout}>
        <HomeHeroSkeleton embedded />
      </View>
    );
  }

  if (!hasLoop) {
    return (
      <View style={styles.wrapper} onLayout={handleLayout}>
        {slideWidth > 0 ? (
          <HeroSlideCard slide={displaySlides[0]!} width={slideWidth} isRtl={isRtl} onBrowseOffers={onBrowseOffers} />
        ) : (
          <View style={styles.heightPlaceholder} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      {slideWidth > 0 ? (
        <FlatList
          ref={listRef}
          data={loopSlides}
          horizontal
          pagingEnabled
          bounces={false}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
          initialScrollIndex={1}
          keyExtractor={(item, index) => `${item.id}-loop-${index}`}
          getItemLayout={(_, index) => ({ length: slideWidth, offset: slideWidth * index, index })}
          onScroll={handleLoopScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleLoopScrollEnd}
          renderItem={({ item }) => (
            <HeroSlideCard slide={item} width={slideWidth} isRtl={isRtl} isCarousel onBrowseOffers={onBrowseOffers} />
          )}
        />
      ) : (
        <View style={styles.heightPlaceholder} />
      )}

      <View style={styles.dots}>
        {displaySlides.map((slide, index) => (
          <Pressable
            key={slide.id}
            accessibilityRole="button"
            onPress={() => handleDotPress(index)}
            style={[styles.dot, activeIndex === index ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    margin: 16,
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: HERO_HEIGHT,
    ...shadow
  },
  heightPlaceholder: {
    height: HERO_HEIGHT
  },
  slide: {
    height: HERO_HEIGHT,
    overflow: 'hidden',
    backgroundColor: colors.brandDark
  },
  heroFill: {
    flex: 1,
    height: HERO_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center'
  },
  heroImage: {
    width: '100%',
    height: HERO_HEIGHT
  },
  heroImageFill: {
    width: '100%',
    height: '100%'
  },
  heroOverlay: {
    flex: 1,
    height: HERO_HEIGHT,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    justifyContent: 'center'
  },
  heroOverlayCarousel: {
    paddingBottom: 28
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    lineHeight: 26
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12
  },
  heroButton: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  heroButtonLtr: {
    alignSelf: 'flex-start'
  },
  heroButtonRtl: {
    alignSelf: 'flex-end'
  },
  heroButtonText: {
    color: colors.brandDark,
    fontWeight: '900',
    fontSize: 13
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  dot: {
    height: 8,
    borderRadius: radius.pill
  },
  dotActive: {
    width: 24,
    backgroundColor: '#fff'
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.5)'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
