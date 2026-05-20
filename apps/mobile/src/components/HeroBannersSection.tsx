import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { fetchHeroBanners } from '../services/hero.service';
import type { HeroBanner } from '../types';
import { colors, radius, shadow } from '../theme';

export function HeroBannersSection() {
  const { locale, t, isRtl } = useI18n();
  const [banners, setBanners] = useState<HeroBanner[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchHeroBanners(locale)
      .then((items) => {
        if (!cancelled) setBanners(items);
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (banners.length === 0) return null;

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.home.bannersTitle}</AppText>
        <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.home.bannersSubtitle}</AppText>
      </View>

      <View style={styles.list}>
        {banners.map((banner) => (
          <Pressable
            key={banner.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => openLink(banner.linkUrl)}
          >
            <Image source={{ uri: banner.imageUrl }} style={styles.image} resizeMode="cover" />
            {banner.text ? (
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.textOverlay}>
                <AppText style={[styles.bannerText, isRtl ? styles.rtl : styles.ltr]} numberOfLines={2}>
                  {banner.text}
                </AppText>
              </LinearGradient>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const BANNER_ASPECT = 990 / 250;

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 4
  },
  header: {
    marginBottom: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted
  },
  list: {
    gap: 12
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }]
  },
  image: {
    width: '100%',
    aspectRatio: BANNER_ASPECT,
    backgroundColor: colors.background
  },
  textOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  bannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
