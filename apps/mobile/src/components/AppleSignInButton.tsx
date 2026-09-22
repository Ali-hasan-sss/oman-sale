import type { ComponentType } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type AppleSignInButtonProps = {
  disabled?: boolean;
  variant?: 'sign-in' | 'sign-up';
  onPress: () => void;
};

type AppleAuthUi = {
  AppleAuthenticationButton: ComponentType<{
    buttonType: number;
    buttonStyle: number;
    cornerRadius: number;
    style: object;
    onPress: () => void;
  }>;
  AppleAuthenticationButtonType: { SIGN_IN: number; SIGN_UP: number };
  AppleAuthenticationButtonStyle: { BLACK: number };
};

function loadAppleAuthUi(): AppleAuthUi | null {
  if (Platform.OS !== 'ios') return null;
  try {
    return require('expo-apple-authentication') as AppleAuthUi;
  } catch {
    return null;
  }
}

export function AppleSignInButton({ disabled, variant = 'sign-in', onPress }: AppleSignInButtonProps) {
  const appleAuth = loadAppleAuthUi();
  if (!appleAuth?.AppleAuthenticationButton) return null;

  const NativeButton = appleAuth.AppleAuthenticationButton;

  return (
    <View pointerEvents={disabled ? 'none' : 'auto'} collapsable={false} style={[styles.wrap, disabled && styles.disabled]}>
      <NativeButton
        buttonType={
          variant === 'sign-up'
            ? appleAuth.AppleAuthenticationButtonType.SIGN_UP
            : appleAuth.AppleAuthenticationButtonType.SIGN_IN
        }
        buttonStyle={appleAuth.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={12}
        style={styles.nativeButton}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%'
  },
  nativeButton: {
    width: '100%',
    height: 48,
    minHeight: 44
  },
  disabled: {
    opacity: 0.7
  }
});
