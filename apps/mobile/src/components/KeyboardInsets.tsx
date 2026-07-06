import { type ReactNode } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import {
  KeyboardAvoidingView as KCKeyboardAvoidingView,
  KeyboardProvider,
  KeyboardStickyView,
  useKeyboardState
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Native keyboard manager — consistent on Android & iOS (dev + release). */
export function KeyboardInsetsProvider({ children }: { children: ReactNode }) {
  return (
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      {children}
    </KeyboardProvider>
  );
}

export function useKeyboardOpen(): boolean {
  const { isVisible } = useKeyboardState();
  return isVisible;
}

/** @deprecated Use ComposerDock — kept for callers that only need safe-area padding */
export function useKeyboardBottomInset(): number {
  return 0;
}

export function composerBottomPadding(_keyboardOpen: boolean, safeBottom: number, min = 10) {
  return Math.max(safeBottom, min);
}

/** @deprecated Use ComposerDock */
export function useComposerBottomPadding() {
  const { bottom } = useSafeAreaInsets();
  return Math.max(bottom, 10);
}

type ComposerDockProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pins a send bar / composer above the keyboard.
 * Uses react-native-keyboard-controller (same approach as Telegram/WhatsApp-style apps).
 */
export function ComposerDock({ children, style }: ComposerDockProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <KeyboardStickyView offset={{ closed: bottom, opened: 0 }} style={style}>
      {children}
    </KeyboardStickyView>
  );
}

type ScreenKeyboardAvoidingProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Full-screen forms (login, profile) */
export function ScreenKeyboardAvoiding({ children, style }: ScreenKeyboardAvoidingProps) {
  const insets = useSafeAreaInsets();

  return (
    <KCKeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {children}
    </KCKeyboardAvoidingView>
  );
}

/** Tab bar / floating UI lift when keyboard is open */
export function useKeyboardLiftHeight(): number {
  const { height, isVisible } = useKeyboardState();
  return isVisible ? height : 0;
}
