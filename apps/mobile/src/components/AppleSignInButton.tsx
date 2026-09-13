import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from './AppText';
import { radius } from '../theme';

type AppleSignInButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

export function AppleSignInButton({ disabled, label, onPress }: AppleSignInButtonProps) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name="logo-apple" size={20} color="#fff" />
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: radius.md,
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  disabled: {
    opacity: 0.7
  },
  label: {
    fontWeight: '800',
    color: '#fff',
    fontSize: 15
  }
});
