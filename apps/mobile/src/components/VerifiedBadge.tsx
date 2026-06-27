import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

type VerifiedBadgeProps = {
  size?: 'sm' | 'md';
};

export function VerifiedBadge({ size = 'sm' }: VerifiedBadgeProps) {
  const dimension = size === 'sm' ? 16 : 20;
  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <View style={[styles.badge, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}>
      <Ionicons name="checkmark" size={iconSize} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D9BF0'
  }
});
