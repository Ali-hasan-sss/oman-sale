import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { HeroBannersSection } from '../components/HeroBannersSection';
import { ListingImageModal } from '../components/ListingImageModal';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { rowDirection } from '../lib/layout-direction';
import { fetchTourismDestination, type TourismDestination } from '../services/tourism.service';
import { colors, radius } from '../theme';

const CONTACT_EMAIL = 'info@omansale.om';

type LandmarkDetailScreenProps = {
  idOrSlug: string;
};

export function LandmarkDetailScreen({ idOrSlug }: LandmarkDetailScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const text = t.landmark;
  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const { scrollBottomPadding } = useScreenInsets();
  const { width: pageWidth } = useWindowDimensions();
  const pagerRef = useRef<FlatList<string>>(null);
  const [destination, setDestination] = useState<TourismDestination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setDestination(null);
    setActiveImage(0);
    fetchTourismDestination(idOrSlug)
      .then((item) => {
        if (!cancelled) setDestination(item);
      })
      .catch(() => {
        if (!cancelled) setDestination(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  const gallery = useMemo(() => {
    if (!destination) return [];
    const images = [destination.imageUrl, ...(destination.galleryImages ?? [])].filter(Boolean);
    return [...new Set(images)];
  }, [destination]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (!destination) {
    return <EmptyState message={text.notFound} />;
  }

  const title = locale === 'en' ? destination.titleEn : destination.titleAr;
  const about = locale === 'en' ? destination.aboutEn : destination.aboutAr;
  const highlights = (locale === 'en' ? destination.highlightsEn : destination.highlightsAr) ?? [];
  const activities = (locale === 'en' ? destination.activitiesEn : destination.activitiesAr) ?? [];
  const bestTime = locale === 'en' ? destination.bestTimeEn : destination.bestTimeAr;
  const address = locale === 'en' ? destination.addressEn : destination.addressAr;
  const ratingLabel = locale === 'en' ? destination.ratingLabelEn : destination.ratingLabelAr;
  const showImage = (index: number) => {
    setActiveImage(index);
    pagerRef.current?.scrollToIndex({ index, animated: true });
  };

  const openGallery = (index: number) => {
    showImage(index);
    setGalleryOpen(true);
  };

  const onHeroSwipeEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (index >= 0 && index < gallery.length && index !== activeImage) setActiveImage(index);
  };

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      >
        <View style={styles.hero}>
          {gallery.length === 0 ? null : (
            <FlatList
              ref={pagerRef}
              data={gallery}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              directionalLockEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.heroPager}
              keyExtractor={(uri, index) => `${uri}-${index}`}
              getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
              extraData={activeImage}
              onMomentumScrollEnd={onHeroSwipeEnd}
              onScrollToIndexFailed={() => undefined}
              renderItem={({ item, index }) => (
                <Pressable style={{ width: pageWidth, height: '100%' }} onPress={() => openGallery(index)}>
                  <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
                </Pressable>
              )}
            />
          )}
          <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.72)']} style={styles.heroShade} />
          <View pointerEvents="none" style={styles.heroCopy}>
            <AppText style={[styles.heroTitle, textAlign]}>{title}</AppText>
            <View style={[styles.ratingRow, rowDirection(isRtl)]}>
              <Ionicons name="star" size={16} color="#facc15" />
              <AppText style={styles.ratingValue}>{destination.rating}</AppText>
              {ratingLabel ? <AppText style={styles.ratingLabel}>{ratingLabel}</AppText> : null}
            </View>
          </View>
          {gallery.length > 1 ? (
            <View style={styles.photoCount}>
              <Ionicons name="images-outline" size={14} color="#0f172a" />
              <AppText style={styles.photoCountText}>
                {activeImage + 1}/{gallery.length}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.banner}>
          <HeroBannersSection placement="DESTINATION" flush />
        </View>

        {gallery.length > 1 ? (
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, textAlign]}>{text.gallery}</AppText>
            <AppText style={[styles.hint, textAlign]}>{text.galleryHint}</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.thumbs, rowDirection(isRtl)]}>
              {gallery.map((uri, index) => (
                <Pressable key={`${uri}-${index}`} onPress={() => showImage(index)} style={[styles.thumb, activeImage === index && styles.thumbActive]}>
                  <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {about ? (
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, textAlign]}>{text.about}</AppText>
            <AppText style={[styles.body, textAlign]}>{about}</AppText>
          </View>
        ) : null}

        {highlights.length > 0 ? (
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, textAlign]}>{text.highlights}</AppText>
            {highlights.map((item) => (
              <View key={item} style={[styles.bulletRow, rowDirection(isRtl)]}>
                <View style={styles.bullet} />
                <AppText style={[styles.body, styles.flex, textAlign]}>{item}</AppText>
              </View>
            ))}
          </View>
        ) : null}

        {activities.length > 0 ? (
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, textAlign]}>{text.activities}</AppText>
            {activities.map((item, index) => (
              <View key={item} style={[styles.bulletRow, rowDirection(isRtl)]}>
                <AppText style={styles.index}>{index + 1}.</AppText>
                <AppText style={[styles.body, styles.flex, textAlign]}>{item}</AppText>
              </View>
            ))}
          </View>
        ) : null}

        {bestTime ? (
          <View style={[styles.section, styles.bestTime]}>
            <View style={[styles.bulletRow, rowDirection(isRtl)]}>
              <Ionicons name="calendar-outline" size={20} color={colors.brand} />
              <AppText style={[styles.sectionTitle, styles.flex, textAlign]}>{text.bestTime}</AppText>
            </View>
            <AppText style={[styles.body, textAlign]}>{bestTime}</AppText>
          </View>
        ) : null}

        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, textAlign]}>{text.contact}</AppText>
          <Pressable style={[styles.contactRow, rowDirection(isRtl)]} onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
            <Ionicons name="mail-outline" size={18} color={colors.brand} />
            <AppText style={styles.email}>{CONTACT_EMAIL}</AppText>
          </Pressable>
          {address ? (
            <View style={[styles.contactRow, rowDirection(isRtl)]}>
              <Ionicons name="location-outline" size={18} color={colors.brand} />
              <AppText style={[styles.body, styles.flex, textAlign]}>{address}</AppText>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ListingImageModal
        visible={galleryOpen}
        images={gallery.map((uri) => ({ uri }))}
        initialIndex={activeImage}
        imageLabel={text.photo}
        onClose={(index) => {
          setGalleryOpen(false);
          if (typeof index === 'number') showImage(index);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hero: {
    height: 280,
    backgroundColor: '#0f172a',
    justifyContent: 'flex-end'
  },
  heroPager: {
    height: 280
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject
  },
  heroCopy: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900'
  },
  ratingRow: {
    marginTop: 8,
    alignItems: 'center',
    gap: 6
  },
  ratingValue: {
    color: '#fff',
    fontWeight: '900'
  },
  ratingLabel: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13
  },
  photoCount: {
    position: 'absolute',
    top: 14,
    alignSelf: 'flex-start',
    marginHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  photoCountText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800'
  },
  banner: {
    marginTop: 12
  },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 8
  },
  hint: {
    color: colors.muted,
    marginBottom: 10,
    fontSize: 13
  },
  body: {
    color: '#334155',
    lineHeight: 24,
    fontSize: 15
  },
  flex: {
    flex: 1
  },
  bulletRow: {
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginTop: 8
  },
  index: {
    color: colors.brand,
    fontWeight: '900',
    minWidth: 22
  },
  bestTime: {
    backgroundColor: '#ecfdf5',
    borderColor: '#bbf7d0'
  },
  contactRow: {
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10
  },
  email: {
    color: colors.brand,
    fontWeight: '800'
  },
  thumbs: {
    gap: 8
  },
  thumb: {
    width: 92,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  thumbActive: {
    borderColor: colors.brand
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
