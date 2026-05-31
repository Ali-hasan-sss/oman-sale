import { useEffect, useState } from 'react';
import { Keyboard, type KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usesManualKeyboardLift } from '../lib/runtime-environment';

/** Keyboard lift for iOS composer / scroll padding (avoids double lift with safe-area). */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  const manualLift = usesManualKeyboardLift();
  const { bottom: safeBottom } = useSafeAreaInsets();

  useEffect(() => {
    if (!manualLift) return;

    const onShow = (event: KeyboardEvent) => {
      const raw = event.endCoordinates.height;
      setInset(Math.max(0, raw - safeBottom));
    };
    const onHide = () => setInset(0);

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [manualLift, safeBottom]);

  return manualLift ? inset : 0;
}
