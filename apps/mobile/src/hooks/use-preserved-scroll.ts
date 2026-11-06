import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView, type ViewStyle } from 'react-native';

const offsets = new Map<string, number>();

/** Remembers a screen's scroll offset across unmounts so back navigation returns to the same place. */
export function usePreservedScroll(key: string) {
  const initialY = offsets.get(key) ?? 0;
  const ref = useRef<ScrollView>(null);
  const savedY = useRef(initialY);
  const restorePending = useRef(initialY > 1);
  const contentOffset = useRef({ x: 0, y: initialY }).current;
  const [hidden, setHidden] = useState(initialY > 1);

  const restore = useCallback(() => {
    if (!restorePending.current) return;
    ref.current?.scrollTo({ y: savedY.current, animated: false });
  }, []);

  useLayoutEffect(() => {
    restore();
  }, [restore]);

  useEffect(() => {
    if (!restorePending.current) return;
    const timers = [0, 32, 80, 160].map((delay) => setTimeout(restore, delay));
    const giveUp = setTimeout(() => {
      restorePending.current = false;
      setHidden(false);
    }, 700);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(giveUp);
    };
  }, [restore]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      if (restorePending.current) {
        if (y + 24 >= savedY.current) {
          restorePending.current = false;
          setHidden(false);
        }
        return;
      }
      savedY.current = y;
      offsets.set(key, y);
    },
    [key]
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      if (!restorePending.current) return;
      if (height > savedY.current + 48) restore();
    },
    [restore]
  );

  const hiddenStyle: ViewStyle | undefined = hidden ? { opacity: 0 } : undefined;

  return {
    ref,
    onScroll,
    onContentSizeChange,
    onLayout: restore,
    scrollEventThrottle: 16 as const,
    contentOffset,
    hiddenStyle
  };
}
