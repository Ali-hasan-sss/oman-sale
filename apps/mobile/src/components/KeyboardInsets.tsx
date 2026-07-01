import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  View,
  useWindowDimensions,
  type KeyboardAvoidingViewProps,
  type KeyboardEvent,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Gboard suggestion bar above keys — not always included in screenY on Android 13+ */
const ANDROID_KEYBOARD_TOOLBAR_GAP = 48;

type InsetOptions = {
  /** true = no manual lift — rely on adjustResize only */
  disabled?: boolean;
};

/**
 * How much the keyboard overlaps the bottom of the app window.
 * Recalculated when window.height changes — when adjustResize works (Android ≤12) this becomes ≈0.
 */
function androidKeyboardOverlap(e: KeyboardEvent, windowHeight: number): number {
  const screenHeight = Dimensions.get('screen').height;
  const windowTopOffset = Math.max(0, screenHeight - windowHeight);
  const keyboardTopInWindow = e.endCoordinates.screenY - windowTopOffset;
  let overlap = Math.max(0, windowHeight - keyboardTopInWindow);

  if (overlap <= 4) return 0;

  if (Number(Platform.Version) >= 33 && overlap < e.endCoordinates.height) {
    overlap = e.endCoordinates.height + ANDROID_KEYBOARD_TOOLBAR_GAP;
  }

  return Math.round(overlap);
}

/** Extra height above the keyboard — Android only */
export function useKeyboardBottomInset(options?: InsetOptions): number {
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardEvent, setKeyboardEvent] = useState<KeyboardEvent | null>(null);
  const eventRef = useRef<KeyboardEvent | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android' || options?.disabled) return;

    const onShow = Keyboard.addListener('keyboardDidShow', (e) => {
      eventRef.current = e;
      setKeyboardEvent(e);
      setTimeout(() => {
        if (eventRef.current) setKeyboardEvent({ ...eventRef.current });
      }, 80);
    });
    const onHide = Keyboard.addListener('keyboardDidHide', () => {
      eventRef.current = null;
      setKeyboardEvent(null);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [options?.disabled]);

  if (Platform.OS !== 'android' || options?.disabled || !keyboardEvent) {
    return 0;
  }

  return androidKeyboardOverlap(keyboardEvent, windowHeight);
}

export function KeyboardInsetsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setOpen(true));
    const hide = Keyboard.addListener(hideEvent, () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return open;
}

/** Bottom padding for a pinned chat composer dock */
export function composerBottomPadding(keyboardOpen: boolean, safeBottom: number, min = 10) {
  return keyboardOpen && Platform.OS === 'ios' ? min : Math.max(safeBottom, min);
}

type AppKeyboardAvoidingViewProps = KeyboardAvoidingViewProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  trustSystemResize?: boolean;
  inModal?: boolean;
};

/**
 * iOS: default KeyboardAvoidingView.
 * Android: smart manual padding — becomes 0 automatically when adjustResize succeeds.
 */
export function KeyboardAvoidingView({
  children,
  style,
  behavior = 'padding',
  keyboardVerticalOffset = 0,
  inModal = false,
  trustSystemResize = Platform.OS === 'android' && (inModal || Number(Platform.Version) < 33),
  ...rest
}: AppKeyboardAvoidingViewProps) {
  const keyboardInset = useKeyboardBottomInset({
    disabled: Platform.OS === 'android' && trustSystemResize
  });

  if (Platform.OS === 'android') {
    return (
      <View style={[style, keyboardInset > 0 ? { paddingBottom: keyboardInset } : null]}>
        {children}
      </View>
    );
  }

  return (
    <RNKeyboardAvoidingView
      style={style}
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      {...rest}
    >
      {children}
    </RNKeyboardAvoidingView>
  );
}

type ScreenKeyboardAvoidingProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Full-screen forms (login, profile) — matches coordinator-app login pattern */
export function ScreenKeyboardAvoiding({ children, style }: ScreenKeyboardAvoidingProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[{ flex: 1 }, style]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
