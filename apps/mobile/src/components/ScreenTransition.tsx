import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Dimensions, Easing, StyleSheet } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDE_DISTANCE = Math.min(SCREEN_WIDTH * 0.28, 120);

export type ScreenTransitionKind = 'push' | 'pop' | 'tab';

type ScreenTransitionProps = {
  screenKey: string;
  transition: ScreenTransitionKind;
  isRtl: boolean;
  children: ReactNode;
};

const getEnterOffset = (transition: ScreenTransitionKind, isRtl: boolean) => {
  if (transition === 'push') {
    return isRtl ? -SLIDE_DISTANCE : SLIDE_DISTANCE;
  }
  if (transition === 'pop') {
    return isRtl ? SLIDE_DISTANCE : -SLIDE_DISTANCE;
  }
  return 0;
};

export function ScreenTransition({ screenKey, transition, isRtl, children }: ScreenTransitionProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const prevKeyRef = useRef(screenKey);

  useEffect(() => {
    if (prevKeyRef.current === screenKey) {
      return;
    }

    const enterOffset = getEnterOffset(transition, isRtl);
    translateX.setValue(enterOffset);
    opacity.setValue(transition === 'tab' ? 0.88 : 0.92);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: transition === 'tab' ? 220 : 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: transition === 'tab' ? 220 : 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();

    prevKeyRef.current = screenKey;
  }, [screenKey, transition, isRtl, opacity, translateX]);

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
