import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  type ReactNode
} from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  type NativeSyntheticEvent,
  type ScrollView as ScrollViewType,
  type ScrollViewProps,
  type StyleProp,
  type TargetedEvent,
  type ViewStyle
} from 'react-native';

import { useKeyboardInset } from '../hooks/use-keyboard-inset';

type ScrollIntoViewHandler = (event: NativeSyntheticEvent<TargetedEvent>) => void;

const KeyboardAwareScrollContext = createContext<ScrollIntoViewHandler | null>(null);

export function useKeyboardAwareScrollHandler() {
  return useContext(KeyboardAwareScrollContext);
}

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  contentContainerStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Extra space above the keyboard when scrolling a focused field into view */
  focusScrollPadding?: number;
};

export const KeyboardAwareScrollView = forwardRef<ScrollViewType, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(
    { contentContainerStyle, focusScrollPadding = 96, children, ...scrollProps },
    ref
  ) {
    const keyboardInset = useKeyboardInset();
    const scrollRef = useRef<ScrollViewType>(null);
    const flatContent = StyleSheet.flatten(contentContainerStyle) as ViewStyle | undefined;
    const baseBottomPadding =
      typeof flatContent?.paddingBottom === 'number' ? flatContent.paddingBottom : 0;

    useImperativeHandle(ref, () => scrollRef.current as ScrollViewType);

    const scrollFocusedIntoView = useCallback<ScrollIntoViewHandler>(
      (event) => {
        const target = event.target;
        const scrollView = scrollRef.current;
        if (!target || !scrollView) return;

        const responder = scrollView.getScrollResponder?.();
        if (responder?.scrollResponderScrollNativeHandleToKeyboard) {
          responder.scrollResponderScrollNativeHandleToKeyboard(target, focusScrollPadding, true);
        }
      },
      [focusScrollPadding]
    );

    return (
      <KeyboardAwareScrollContext.Provider value={scrollFocusedIntoView}>
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            contentContainerStyle,
            keyboardInset > 0 ? { paddingBottom: baseBottomPadding + keyboardInset } : null
          ]}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </KeyboardAwareScrollContext.Provider>
    );
  }
);
