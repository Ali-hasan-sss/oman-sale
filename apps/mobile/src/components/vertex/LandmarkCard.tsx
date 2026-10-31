import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '../AppText';
import { useI18n } from '../../i18n';
import { insetEnd, rowDirection } from '../../lib/layout-direction';

type LandmarkCardProps = {
  index: number;
  image: string;
  title: string;
  place?: string;
  description?: string;
  width: number;
  onPress?: () => void;
};

/** Numbered landmark card: photo, rank badge, title, place, two-line blurb, CTA. */
export function LandmarkCard({ index, image, title, place, description, width, onPress }: LandmarkCardProps) {
  const { locale, isRtl } = useI18n();
  const [broken, setBroken] = useState(false);
  const cta = locale === 'en' ? 'Photos, weather & best time' : 'الصور والطقس ووقت الزيارة';

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}>
      <View style={styles.media}>
        <LinearGradient colors={['#dcfce7', '#e2e8f0']} style={StyleSheet.absoluteFill} />
        {image && !broken ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setBroken(true)} />
        ) : null}
        <View style={[styles.rank, insetEnd(isRtl, 10)]}>
          <AppText style={styles.rankText}>{index + 1}</AppText>
        </View>
      </View>
      <View style={styles.body}>
        <AppText style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
        {place ? (
          <View style={[styles.placeRow, rowDirection(isRtl)]}>
            <Ionicons name="location-outline" size={13} color="#11703e" />
            <AppText style={styles.place} numberOfLines={1}>
              {place}
            </AppText>
          </View>
        ) : null}
        {description ? (
          <AppText style={styles.description} numberOfLines={2}>
            {description}
          </AppText>
        ) : null}
        <AppText style={styles.cta} numberOfLines={1}>
          {cta}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  pressed: {
    opacity: 0.92
  },
  media: {
    height: 118,
    overflow: 'hidden'
  },
  rank: {
    position: 'absolute',
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center'
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    flex: 1
  },
  title: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '900',
    color: '#0f172a'
  },
  placeRow: {
    marginTop: 4,
    alignItems: 'center',
    gap: 3
  },
  place: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#11703e'
  },
  description: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 19,
    color: '#475569'
  },
  cta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '900',
    color: '#f32b2b'
  }
});
