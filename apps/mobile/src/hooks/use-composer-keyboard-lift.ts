import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  type KeyboardEvent,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Wait for window resize on Android before deciding manual lift is needed. */
const ANDROID_RESIZE_PROBE_MS = 100;
const ANDROID_RESIZE_REPROBE_MS = 220;

/**
 * Bottom margin for chat composer when the OS does not shrink the window (common in EAS Android builds).
 * iOS always uses manual lift; Android uses lift only if adjustResize did not reduce window height.
 */
export function useComposerKeyboardLift() {
  const [lift, setLift] = useState(0);
  const { bottom: safeBottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const windowHeightRef = useRef(windowHeight);
  const baselineHeightRef = useRef(windowHeight);
  const probeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    windowHeightRef.current = windowHeight;
    if (lift === 0) {
      baselineHeightRef.current = windowHeight;
    }
  }, [windowHeight, lift]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const clearProbes = () => {
      probeTimeoutsRef.current.forEach(clearTimeout);
      probeTimeoutsRef.current = [];
    };

    const applyAndroidLift = (kbHeight: number) => {
      const baseline = baselineHeightRef.current;
      const shrunk = baseline - windowHeightRef.current;
      const windowResized = shrunk > kbHeight * 0.2;
      setLift(windowResized ? 0 : Math.max(0, kbHeight - safeBottom));
    };

    const onShow = (event: KeyboardEvent) => {
      const kbHeight = event.endCoordinates.height;
      clearProbes();

      if (Platform.OS === 'ios') {
        setLift(Math.max(0, kbHeight - safeBottom));
        return;
      }

      const scheduleProbe = (delay: number) => {
        const id = setTimeout(() => applyAndroidLift(kbHeight), delay);
        probeTimeoutsRef.current.push(id);
      };
      scheduleProbe(ANDROID_RESIZE_PROBE_MS);
      scheduleProbe(ANDROID_RESIZE_REPROBE_MS);
    };

    const onHide = () => {
      clearProbes();
      setLift(0);
      baselineHeightRef.current = windowHeightRef.current;
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      clearProbes();
      showSub.remove();
      hideSub.remove();
      setLift(0);
    };
  }, [safeBottom]);

  return lift;
}
