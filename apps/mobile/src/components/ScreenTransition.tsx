import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export type ScreenTransitionKind = 'push' | 'pop' | 'tab';

type ScreenTransitionProps = {
  screenKey: string;
  transition: ScreenTransitionKind;
  isRtl: boolean;
  children: ReactNode;
};

export function ScreenTransition({ children }: ScreenTransitionProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    overflow: 'hidden'
  }
});
