import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from './AppText';
import { HomeHeroSkeleton } from './skeleton';
import { GlowButton } from './vertex/GlowButton';
import { OmanMapSvg } from './vertex/OmanMapSvg';
import { VertexRing, type RingShot } from './vertex/VertexRing';
import { useI18n } from '../i18n';
import { getCachedHeroSlides, isHeroSlidesLoaded, setCachedHeroSlides } from '../lib/screen-data-cache';
import { insetStart } from '../lib/layout-direction';
import { fetchHeroSlides } from '../services/hero.service';
import type { HeroSlide } from '../types';

type HomeHeroSectionProps = {
  onBrowseOffers: () => void;
  onAddListing?: () => void;
};

const SLIDE_INTERVAL_MS = 6500;

/* Web canvas is 1172 design px wide; the phone keeps the cards readable with k ≥ 0.62. */
const DESIGN_W = 1172;
/* Ring box (design px): card plane centre, horizon (perspective origin) and the mock's top. */
const PLANE_Y = 216;
const HORIZON_Y = 518;
const MOCK_TOP = 330;
const RING_BOX_H = 580;

const resolveHeroAction = (link: string, onBrowseOffers: () => void) => {
  if (/^https?:\/\//i.test(link)) {
    Linking.openURL(link).catch(() => undefined);
    return;
  }
  const path = link.replace(/^\//, '').toLowerCase();
  if (path === 'all-listings' || path === 'offers' || path === '') onBrowseOffers();
};

const copyFor = (locale: string) =>
  locale === 'en'
    ? {
        badge: "Oman's all-in-one listings platform",
        secondary: 'Post an ad',
        announcement: 'Thousands of trusted listings across every governorate',
        kicker: 'Just added',
        explore: 'Explore now'
      }
    : {
        badge: 'منصة الإعلانات الأولى في سلطنة عُمان',
        secondary: 'أضف إعلانك',
        announcement: 'آلاف الإعلانات الموثوقة في كل محافظات السلطنة',
        kicker: 'جديد اليوم',
        explore: 'تصفح الآن'
      };

export function HomeHeroSection({ onBrowseOffers, onAddListing }: HomeHeroSectionProps) {
  const { locale, isRtl, t } = useI18n();
  const { width } = useWindowDimensions();
  const copy = copyFor(locale);
  const [slides, setSlides] = useState<HeroSlide[]>(() => getCachedHeroSlides(locale));
  const [isLoadingApi, setIsLoadingApi] = useState(() => !isHeroSlidesLoaded(locale));
  const [activeIndex, setActiveIndex] = useState(0);
  const [badgeY, setBadgeY] = useState(0);
  const [ringTop, setRingTop] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (isHeroSlidesLoaded(locale)) {
      setSlides(getCachedHeroSlides(locale));
      setIsLoadingApi(false);
    } else {
      setIsLoadingApi(true);
    }
    fetchHeroSlides(locale, 'mobile')
      .then((items) => {
        if (cancelled) return;
        setCachedHeroSlides(locale, items);
        setSlides(items);
        setActiveIndex(0);
      })
      .catch(() => {
        if (cancelled) return;
        setCachedHeroSlides(locale, []);
        setSlides([]);
        setActiveIndex(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingApi(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const displaySlides: HeroSlide[] =
    slides.length > 0
      ? slides
      : [
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
  const current = displaySlides[activeIndex] ?? displaySlides[0]!;

  useEffect(() => {
    if (displaySlides.length <= 1) return undefined;
    const timer = setInterval(() => setActiveIndex((index) => (index + 1) % displaySlides.length), SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [displaySlides.length]);

  // The ring shows the admin slider: card image if set, otherwise the slide image.
  const shots = useMemo<RingShot[]>(
    () =>
      displaySlides.map((slide) => ({
        id: slide.id,
        image: slide.cardImageUrl || slide.imageUrl,
        title: slide.title,
        subtitle: slide.subtitle
      })),
    [displaySlides]
  );

  const k = Math.min(Math.max(width / DESIGN_W, 0.62), 1.2);
  const ringBoxH = RING_BOX_H * k;
  const mockTop = MOCK_TOP * k;

  // Map: pinned to the badge, running down behind the ring to just past the mock's top.
  const mapTop = badgeY;
  const mapHeight = Math.max(320, ringTop + mockTop + 80 - badgeY);
  const mapWidth = Math.min(width * 0.96, (mapHeight * 600) / 700);

  if (isLoadingApi && !isHeroSlidesLoaded(locale) && slides.length === 0) {
    return (
      <View style={styles.wrapper}>
        <HomeHeroSkeleton height={520} embedded />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={['#ffffff', '#f5f9fc', '#e9f3f8']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(63,211,239,0.14)', 'rgba(63,211,239,0)']}
        style={styles.topGlow}
        pointerEvents="none"
      />

      {badgeY > 0 ? (
        <View pointerEvents="none" style={[styles.map, { top: mapTop, left: (width - mapWidth) / 2, width: mapWidth, height: mapHeight }]}>
          <OmanMapSvg width={mapWidth} height={mapHeight} locale={locale} />
        </View>
      ) : null}

      <View style={styles.copy}>
        <View style={styles.badge} onLayout={(event: LayoutChangeEvent) => setBadgeY(event.nativeEvent.layout.y + 0.1)}>
          <View style={[styles.badgeTile, insetStart(isRtl, 4)]}>
            <LinearGradient
              colors={['#060d16', '#090f25', '#053f58', '#0b859d', '#46afc8']}
              locations={[0, 0.35, 0.62, 0.85, 1]}
              style={StyleSheet.absoluteFill}
            />
            <Svg width={13} height={16} viewBox="5 1 14 22">
              <Path
                d="M13.9 1.6 5.5 13.6a.7.7 0 0 0 .6 1.1h4.2l-1 7.7a.7.7 0 0 0 1.25.55l8.3-12.1a.7.7 0 0 0-.6-1.1h-4.2l1-7.7a.7.7 0 0 0-1.25-.55Z"
                fill="rgba(16,112,152,.72)"
                stroke="rgba(190,236,255,.6)"
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <AppText style={styles.badgeText} numberOfLines={1}>
            {copy.badge}
          </AppText>
        </View>

        <AppText style={styles.title} numberOfLines={3}>
          {current.title}
        </AppText>
        <AppText style={styles.subtitle} numberOfLines={3}>
          {current.subtitle}
        </AppText>

        <View style={styles.ctaRow}>
          <GlowButton label={current.buttonLabel} onPress={() => resolveHeroAction(current.buttonLink, onBrowseOffers)} />
          {onAddListing ? (
            <Pressable onPress={onAddListing} style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.85 }]}>
              <AppText style={styles.ghostText}>{copy.secondary}</AppText>
            </Pressable>
          ) : null}
        </View>

        {displaySlides.length > 1 ? (
          <View style={styles.dots}>
            {displaySlides.map((slide, index) => (
              <Pressable
                key={slide.id}
                hitSlop={8}
                accessibilityRole="button"
                onPress={() => setActiveIndex(index)}
                style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
              />
            ))}
          </View>
        ) : null}
      </View>

      {/* ring + browser mock; the mock paints in FRONT of the ring and bleeds off the bottom */}
      <View style={[styles.stage, { height: ringBoxH }]} onLayout={(event) => setRingTop(event.nativeEvent.layout.y)}>
        <VertexRing shots={shots} width={width} k={k} height={ringBoxH} planeY={PLANE_Y * k} horizonY={HORIZON_Y * k} />

        <View style={[styles.mock, { top: mockTop }]}>
          <View style={styles.bar}>
            <View style={styles.barDots}>
              <View style={[styles.barDot, { backgroundColor: '#ee5c62' }]} />
              <View style={[styles.barDot, { backgroundColor: '#f6b719' }]} />
              <View style={[styles.barDot, { backgroundColor: '#12c02f' }]} />
            </View>
            <View style={styles.omni}>
              <AppText style={styles.omniText}>omansale.om</AppText>
            </View>
          </View>
          <View style={styles.page}>
            <View style={styles.ann}>
              <AppText style={styles.annText} numberOfLines={1}>
                {copy.announcement}
              </AppText>
            </View>
            <View style={styles.pageHead}>
              <Image source={require('../../assets/nav-logo.png')} style={styles.pageLogo} resizeMode="contain" />
            </View>
            <Pressable style={styles.banner} onPress={() => resolveHeroAction(current.buttonLink, onBrowseOffers)}>
              {current.imageUrl ? (
                <Image source={{ uri: current.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : null}
              <LinearGradient
                colors={isRtl ? ['rgba(8,14,22,0)', 'rgba(8,14,22,0.75)'] : ['rgba(8,14,22,0.75)', 'rgba(8,14,22,0)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.bannerCopy, insetStart(isRtl, 14)]}>
                <AppText style={styles.bannerKicker}>{copy.kicker}</AppText>
                <AppText style={styles.bannerTitle} numberOfLines={2}>
                  {current.title}
                </AppText>
                <View style={styles.bannerPill}>
                  <AppText style={styles.bannerPillText}>{copy.explore}</AppText>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: '#f5f9fc'
  },
  topGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 220
  },
  map: {
    position: 'absolute',
    opacity: 0.85
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    zIndex: 3
  },
  badge: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.09)',
    backgroundColor: 'rgba(255,255,255,0.88)',
    justifyContent: 'center',
    paddingHorizontal: 42,
    maxWidth: '100%',
    shadowColor: '#0f2846',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  badgeTile: {
    position: 'absolute',
    top: 3,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center'
  },
  title: {
    marginTop: 16,
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '900',
    color: '#0b1220',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
    color: '#5b6472',
    textAlign: 'center',
    maxWidth: 340,
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  ctaRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  ghost: {
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.14)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center'
  },
  ghostText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0b1220'
  },
  dots: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 6
  },
  dot: {
    height: 4,
    width: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(15,23,42,0.15)'
  },
  dotActive: {
    width: 30,
    backgroundColor: '#3ec8e4'
  },
  stage: {
    marginTop: 4,
    zIndex: 2
  },
  mock: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 420,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(241,245,249,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    zIndex: 1000,
    elevation: 12,
    shadowColor: '#0f2846',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -8 }
  },
  bar: {
    height: 36,
    justifyContent: 'center'
  },
  barDots: {
    position: 'absolute',
    left: 16,
    top: 14,
    flexDirection: 'row',
    gap: 3
  },
  barDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  omni: {
    alignSelf: 'center',
    width: '58%',
    height: 24,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  omniText: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center'
  },
  page: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden'
  },
  ann: {
    height: 18,
    backgroundColor: '#0b0f16',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  annText: {
    fontSize: 8.5,
    color: '#cfd6de',
    textAlign: 'center'
  },
  pageHead: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f3'
  },
  pageLogo: {
    height: 26,
    width: 90
  },
  banner: {
    marginHorizontal: 14,
    marginTop: 12,
    height: 128,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1d3b4d'
  },
  bannerCopy: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    maxWidth: '72%'
  },
  bannerKicker: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)'
  },
  bannerTitle: {
    marginTop: 3,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '900',
    color: '#fff'
  },
  bannerPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  bannerPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0b0f16'
  }
});
