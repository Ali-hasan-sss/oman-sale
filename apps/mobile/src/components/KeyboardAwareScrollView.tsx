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
  type NativeSyntheticEvent,
  type ScrollView as ScrollViewType,
  type ScrollViewProps,
  type StyleProp,
  type TargetedEvent,
  type ViewStyle
} from 'react-native';

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
  /** Disable scroll keyboard insets when a fixed bottom composer handles lifting */
  disableKeyboardInset?: boolean;
};

export const KeyboardAwareScrollView = forwardRef<ScrollViewType, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(
    {
      contentContainerStyle,
      focusScrollPadding = 96,
      disableKeyboardInset = false,
      children,
      ...scrollProps
    },
    ref
  ) {
    const scrollRef = useRef<ScrollViewType>(null);
    const adjustKeyboardInsets = Platform.OS === 'ios' && !disableKeyboardInset;

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
          automaticallyAdjustKeyboardInsets={adjustKeyboardInsets}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={contentContainerStyle}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </KeyboardAwareScrollContext.Provider>
    );
  }
);
