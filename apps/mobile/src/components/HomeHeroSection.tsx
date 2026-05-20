import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent
} from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { fetchHeroSlides } from '../services/hero.service';
import type { HeroSlide } from '../types';
import { colors, radius, shadow } from '../theme';

type HomeHeroSectionProps = {
  onBrowseOffers: () => void;
};

const SLIDE_INTERVAL_MS = 3000;
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

type HeroSlideCardProps = {
  slide: HeroSlide;
  width?: number;
  isRtl: boolean;
  isCarousel?: boolean;
  onBrowseOffers: () => void;
};

function HeroSlideCard({ slide, width, isRtl, isCarousel, onBrowseOffers }: HeroSlideCardProps) {
  const content = (
    <>
      <AppText style={[styles.heroTitle, isRtl ? styles.rtl : styles.ltr]}>{slide.title}</AppText>
      <AppText style={[styles.heroSubtitle, isRtl ? styles.rtl : styles.ltr]}>{slide.subtitle}</AppText>
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
      <View style={[styles.slide, width ? { width } : null]}>
        <ImageBackground source={{ uri: slide.imageUrl }} style={styles.heroImage} imageStyle={styles.heroImageRadius}>
          <LinearGradient colors={HERO_OVERLAY} style={[styles.heroOverlay, isCarousel && styles.heroOverlayCarousel]}>
            {content}
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={[styles.slide, width ? { width } : null]}>
      <LinearGradient colors={[colors.brand, colors.brandDark]} style={[styles.hero, isCarousel && styles.heroOverlayCarousel]}>
        {content}
      </LinearGradient>
    </View>
  );
}

export function HomeHeroSection({ onBrowseOffers }: HomeHeroSectionProps) {
  const { locale, t, isRtl } = useI18n();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const listRef = useRef<FlatList<HeroSlide>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchHeroSlides(locale, 'mobile')
      .then((items) => {
        if (!cancelled) {
          setSlides(items.filter((item) => item.platform !== 'WEB'));
          setActiveIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSlides([]);
          setActiveIndex(0);
        }
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

  const goToSlide = useCallback(
    (index: number, animated = true) => {
      if (slideWidth <= 0 || displaySlides.length <= 1) return;
      const safeIndex = ((index % displaySlides.length) + displaySlides.length) % displaySlides.length;
      listRef.current?.scrollToOffset({ offset: safeIndex * slideWidth, animated });
      setActiveIndex(safeIndex);
    },
    [displaySlides.length, slideWidth]
  );

  const clearAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    clearAutoPlay();
    if (displaySlides.length <= 1 || slideWidth <= 0) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % displaySlides.length;
        listRef.current?.scrollToOffset({ offset: next * slideWidth, animated: true });
        return next;
      });
    }, SLIDE_INTERVAL_MS);
  }, [clearAutoPlay, displaySlides.length, slideWidth]);

  useEffect(() => {
    startAutoPlay();
    return clearAutoPlay;
  }, [startAutoPlay, clearAutoPlay]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== slideWidth) {
      setSlideWidth(width);
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(index);
    startAutoPlay();
  };

  const handleDotPress = (index: number) => {
    goToSlide(index);
    startAutoPlay();
  };

  if (displaySlides.length === 1) {
    return (
      <View style={styles.wrapper} onLayout={handleLayout}>
        <HeroSlideCard slide={displaySlides[0]!} isRtl={isRtl} onBrowseOffers={onBrowseOffers} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      {slideWidth > 0 ? (
        <FlatList
          ref={listRef}
          data={displaySlides}
          horizontal
          pagingEnabled
          bounces={false}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({ length: slideWidth, offset: slideWidth * index, index })}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item }) => (
            <HeroSlideCard slide={item} width={slideWidth} isRtl={isRtl} isCarousel onBrowseOffers={onBrowseOffers} />
          )}
        />
      ) : null}

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
    ...shadow
  },
  slide: {
    overflow: 'hidden',
    borderRadius: radius.lg
  },
  hero: {
    padding: 24,
    minHeight: 200,
    justifyContent: 'center'
  },
  heroImage: {
    minHeight: 200
  },
  heroImageRadius: {
    borderRadius: radius.lg
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    minHeight: 200
  },
  heroOverlayCarousel: {
    paddingBottom: 36
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 24,
    marginBottom: 18
  },
  heroButton: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  heroButtonLtr: {
    alignSelf: 'flex-start'
  },
  heroButtonRtl: {
    alignSelf: 'flex-end'
  },
  heroButtonText: {
    color: colors.brandDark,
    fontWeight: '900'
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
