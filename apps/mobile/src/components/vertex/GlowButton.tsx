import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';

type GlowButtonProps = {
  label: string;
  onPress?: () => void;
  height?: number;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
};

/**
 * Vertex "glow" button: near-black body with a bank of cyan light pooled at the foot,
 * clipped by the button's own rounded rect (no outer halo).
 */
export function GlowButton({ label, onPress, height = 50, fontSize = 15, style, icon }: GlowButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, { height, opacity: pressed ? 0.9 : 1 }, style]}>
      <LinearGradient
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        colors={['#9ad9ec', '#61daef', '#14a8c6', '#047796', '#025066', '#0a2a37', '#0f1824', '#0a111d', '#0a111d']}
        locations={[0, 0.04, 0.12, 0.18, 0.24, 0.36, 0.48, 0.66, 1]}
      />
      <View style={styles.edges} pointerEvents="none" />
      <View style={styles.content}>
        {icon}
        <AppText style={[styles.label, { fontSize }]}>{label}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 24,
    justifyContent: 'center',
    minWidth: 130,
    shadowColor: '#14b4e1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  edges: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(152,218,234,0.22)'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  label: {
    color: '#fff',
    fontWeight: '800',
    textShadowColor: 'rgba(0,20,30,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  }
});
