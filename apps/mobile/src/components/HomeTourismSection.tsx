import { useEffect, useState } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from './AppText';
import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';

type Destination = {
  id: string;
  slug: string;
  imageUrl: string;
  titleAr: string;
  titleEn: string;
  rating: string;
  ratingLabelAr: string;
  ratingLabelEn: string;
  bestTimeAr: string;
  bestTimeEn: string;
  addressAr: string;
  addressEn: string;
};

const fallbackImages = [
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=450&fit=crop',
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&h=450&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=450&fit=crop',
  'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=450&fit=crop'
];

export function HomeTourismSection() {
  const { locale, t, isRtl } = useI18n();
  const copyAlign = isRtl ? 'right' : 'left';
  const { width } = useWindowDimensions();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const outerTile = (width - 32 - 12) / 2;
  const innerTile = (width - 64 - 12) / 2;

  useEffect(() => {
    let cancelled = false;
    http
      .get<ApiEnvelope<Destination[]>>(API_ENDPOINTS.tourism.destinations)
      .then((response) => {
        if (!cancelled) setDestinations(Array.isArray(response.data.data) ? response.data.data : []);
      })
      .catch(() => {
        if (!cancelled) setDestinations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = (destinations.length > 0 ? destinations : fallbackImages.map((image, index) => ({
    id: String(index),
    slug: String(index),
    imageUrl: image,
    titleAr: t.home.destinations[index] ?? '',
    titleEn: t.home.destinations[index] ?? '',
    rating: '4.9',
    ratingLabelAr: '',
    ratingLabelEn: '',
    bestTimeAr: '',
    bestTimeEn: '',
    addressAr: '',
    addressEn: ''
  }))).slice(0, 4);

  const grid = destinations.length > 0 ? destinations : featured;

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#0e5630', '#8c1414']} style={styles.hero}>
        <View style={styles.experienceGrid}>
          {featured.map((destination, index) => {
            const title = locale === 'en' ? destination.titleEn : destination.titleAr;
            const description = t.home.experiences[index]?.[1] ?? '';
            return (
              <View key={destination.id} style={[styles.experience, { width: innerTile, height: 150 }]}>
                <Image source={{ uri: destination.imageUrl }} style={StyleSheet.absoluteFill} />
                <View style={styles.experienceShade} />
                <AppText style={styles.experienceTitle} numberOfLines={1}>
                  {title}
                </AppText>
                <AppText style={styles.experienceText} numberOfLines={2}>
                  {description}
                </AppText>
              </View>
            );
          })}
        </View>
        <AppText style={[styles.heroTitle, { textAlign: copyAlign }]}>{t.home.tourismTitle}</AppText>
        <AppText style={[styles.heroText, { textAlign: copyAlign }]}>{t.home.tourismDescription}</AppText>
      </LinearGradient>

      <AppText style={styles.kicker}>{t.home.exploreOman}</AppText>
      <AppText style={styles.sectionTitle}>{t.home.destinationsTitle}</AppText>
      <AppText style={styles.sectionSubtitle}>{t.home.destinationsSubtitle}</AppText>
      <View style={styles.experienceGrid}>
        {grid.map((destination) => {
          const title = locale === 'en' ? destination.titleEn : destination.titleAr;
          return (
            <View key={`grid-${destination.id}`} style={[styles.destination, { width: outerTile }]}>
              <Image source={{ uri: destination.imageUrl }} style={StyleSheet.absoluteFill} />
              <View style={styles.experienceShade} />
              <AppText style={styles.destinationTitle} numberOfLines={2}>
                {title}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    marginBottom: 8
  },
  hero: {
    borderRadius: 28,
    padding: 16,
    marginBottom: 22
  },
  experienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  experience: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 10
  },
  experienceShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  experienceTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16
  },
  experienceText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    marginTop: 2
  },
  heroTitle: {
    marginTop: 18,
    color: '#fff',
    fontSize: 32,
    fontWeight: '900'
  },
  heroText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    fontSize: 15
  },
  kicker: {
    textAlign: 'center',
    color: '#168c4e',
    fontWeight: '800',
    marginBottom: 6
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  sectionSubtitle: {
    textAlign: 'center',
    color: '#475569',
    marginTop: 6,
    marginBottom: 14
  },
  destination: {
    height: 168,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 12
  },
  destinationTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18
  }
});
