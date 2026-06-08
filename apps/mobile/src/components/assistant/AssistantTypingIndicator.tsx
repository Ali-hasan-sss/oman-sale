import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { colors } from '../../theme';

type AssistantTypingIndicatorProps = {
  label: string;
  rtl?: boolean;
};

function Dot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.delay(600 - delay)
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4]
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          transform: [{ translateY }]
        }
      ]}
    />
  );
}

export function AssistantTypingIndicator({ label, rtl }: AssistantTypingIndicatorProps) {
  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel={label}>
      <AppText style={[styles.label, rtl ? styles.rtl : styles.ltr]}>{label}</AppText>
      <View style={styles.dots}>
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFEFEF',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  label: {
    fontSize: 13,
    color: colors.muted
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#9B9B9B'
  }
});
