import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  type KeyboardEvent,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom margin for the chat composer on iOS when the keyboard is open.
 *
 * Android uses adjustResize + expo-android-keyboard-fix — the window already shrinks,
 * so any manual marginBottom stacks on top and doubles the lift.
 */
export function useComposerKeyboardLift() {
  const [lift, setLift] = useState(0);
  const { bottom: safeBottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const windowHeightRef = useRef(windowHeight);
  const baselineHeightRef = useRef(windowHeight);
  const keyboardOpenRef = useRef(false);
  const kbHeightRef = useRef(0);

  useEffect(() => {
    windowHeightRef.current = windowHeight;
  }, [windowHeight]);

  useEffect(() => {
    if (Platform.OS === 'android') return;

    if (!keyboardOpenRef.current) {
      baselineHeightRef.current = windowHeight;
      return;
    }

    const kbHeight = kbHeightRef.current;
    if (kbHeight <= 0) return;

    const shrunk = baselineHeightRef.current - windowHeight;
    const osHandledKeyboard = shrunk > 48 || shrunk > kbHeight * 0.12;
    setLift(osHandledKeyboard ? 0 : Math.max(0, kbHeight - safeBottom));
  }, [windowHeight, safeBottom]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      setLift(0);
      return;
    }

    const onShow = (event: KeyboardEvent) => {
      const kbHeight = event.endCoordinates.height;
      kbHeightRef.current = kbHeight;
      baselineHeightRef.current = windowHeightRef.current;
      keyboardOpenRef.current = true;
      setLift(Math.max(0, kbHeight - safeBottom));
    };

    const onHide = () => {
      keyboardOpenRef.current = false;
      kbHeightRef.current = 0;
      setLift(0);
      baselineHeightRef.current = windowHeightRef.current;
    };

    const showSub = Keyboard.addListener('keyboardWillShow', onShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
      keyboardOpenRef.current = false;
      kbHeightRef.current = 0;
      setLift(0);
    };
  }, [safeBottom]);

  if (Platform.OS === 'android') {
    return 0;
  }

  return lift;
}
