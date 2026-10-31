import { LinearGradient } from 'expo-linear-gradient';
import { memo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  type SharedValue
} from 'react-native-reanimated';

import { AppText } from '../AppText';

export type RingShot = {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
};

/*
 * Same ring as the web hero, projected by hand for React Native (no translateZ):
 * 37 cards on a cylinder of radius R with the camera AT the centre (perspective = R).
 * A card at angle a is pushed toward the camera by R(1 - cos a), so its projected
 * scale is 1 / cos a and its x is R·tan a — edge cards grow and rise, centre sinks.
 * Cards beyond ±42° are culled.
 */
const COUNT = 37;
const STEP = 360 / COUNT;
const CULL = 42;
const SPEED = 1.9; // deg / s

type VertexRingProps = {
  shots: RingShot[];
  width: number;
  /** design → screen scale (web canvas is 1172 wide) */
  k: number;
  height: number;
  /** y of the card plane centre and of the horizon, in screen px from the top of the ring box */
  planeY: number;
  horizonY: number;
};

export function VertexRing({ shots, width, k, height, planeY, horizonY }: VertexRingProps) {
  const phase = useSharedValue(-2);
  const reduceMotion = useReducedMotion();

  useFrameCallback((frame) => {
    if (reduceMotion) return;
    const dt = Math.min((frame.timeSincePreviousFrame ?? 16) / 1000, 0.1);
    phase.value -= SPEED * dt;
  });

  if (shots.length === 0) return null;

  const cardW = 130 * k;
  const cardH = 300 * k;
  const radius = 891 * k;

  return (
    <View style={[styles.box, { width, height }]} pointerEvents="none">
      {Array.from({ length: COUNT }, (_, index) => (
        <RingCard
          key={index}
          index={index}
          shot={shots[index % shots.length]!}
          phase={phase}
          cx={width / 2}
          radius={radius}
          cardW={cardW}
          cardH={cardH}
          planeY={planeY}
          horizonY={horizonY}
          k={k}
        />
      ))}
    </View>
  );
}

type RingCardProps = {
  index: number;
  shot: RingShot;
  phase: SharedValue<number>;
  cx: number;
  radius: number;
  cardW: number;
  cardH: number;
  planeY: number;
  horizonY: number;
  k: number;
};

const RingCard = memo(function RingCard({ index, shot, phase, cx, radius, cardW, cardH, planeY, horizonY, k }: RingCardProps) {
  const [broken, setBroken] = useState(false);

  const cardStyle = useAnimatedStyle(() => {
    const a = ((((index * STEP + phase.value) % 360) + 540) % 360) - 180;
    if (Math.abs(a) > CULL) {
      return { opacity: 0, transform: [{ translateX: -10000 }] };
    }
    const r = (a * Math.PI) / 180;
    const s = 1 / Math.cos(r);
    return {
      opacity: 1,
      zIndex: Math.round(Math.abs(a) * 10),
      transform: [
        { translateX: cx + radius * Math.tan(r) - cardW / 2 },
        { translateY: horizonY + (planeY - horizonY) * s - cardH / 2 },
        { perspective: radius * 0.9 },
        { rotateY: `${-a}deg` },
        { scale: s }
      ]
    };
  });

  const shadeStyle = useAnimatedStyle(() => {
    const a = ((((index * STEP + phase.value) % 360) + 540) % 360) - 180;
    const s = 1 / Math.cos((a * Math.PI) / 180);
    // web: brightness(0.84 + 0.5 (1/cos a − 1)) — dim the centre a touch
    return { opacity: Math.max(0, 0.16 - 0.5 * (s - 1)) };
  });

  return (
    <Animated.View style={[styles.card, { width: cardW, height: cardH, borderRadius: 12 * k + 2 }, cardStyle]}>
      <LinearGradient colors={['#2b3b50', '#131c28', '#1d1526']} style={StyleSheet.absoluteFill} />
      {shot.image && !broken ? (
        <Image source={{ uri: shot.image }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setBroken(true)} />
      ) : null}
      <LinearGradient
        colors={['rgba(4,8,16,0.9)', 'rgba(4,8,16,0.55)', 'rgba(4,8,16,0)']}
        locations={[0, 0.3, 0.52]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.meta, { top: 30 * k, paddingHorizontal: 9 * k }]}>
        <AppText style={[styles.title, { fontSize: Math.max(9, 12.5 * k) }]} numberOfLines={2}>
          {shot.title}
        </AppText>
        {shot.subtitle ? (
          <AppText style={[styles.subtitle, { fontSize: Math.max(7.5, 9.5 * k) }]} numberOfLines={3}>
            {shot.subtitle}
          </AppText>
        ) : null}
      </View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.shade, shadeStyle]} />
      <View style={[StyleSheet.absoluteFill, styles.edge, { borderRadius: 12 * k + 2 }]} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    left: 0,
    top: 0,
    direction: 'ltr'
  },
  card: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
    backgroundColor: '#0d1117',
    shadowColor: '#0f2846',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8
  },
  meta: {
    position: 'absolute',
    left: 0,
    right: 0
  },
  title: {
    color: '#fff',
    fontWeight: '900',
    lineHeight: undefined
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    marginTop: 3
  },
  shade: {
    backgroundColor: '#000'
  },
  edge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  }
});
