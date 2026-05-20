import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenInsetsContext } from '../context/screen-insets-context';

/** Approximate tab bar content height (excluding safe-area bottom). */
const TAB_BAR_CONTENT_HEIGHT = 74;
/** Extra scroll space for the center FAB overlapping content. */
const TAB_BAR_FAB_CLEARANCE = 36;

type ScreenInsetsOptions = {
  /** Override tab bar visibility for this screen (defaults to MainShell context). */
  withTabBar?: boolean;
};

export function useScreenInsets(options?: ScreenInsetsOptions) {
  const insets = useSafeAreaInsets();
  const { withTabBar: contextWithTabBar } = useScreenInsetsContext();
  const withTabBar = options?.withTabBar ?? contextWithTabBar;

  const tabBarBottom = Math.max(insets.bottom, 10);
  const scrollBottomPadding = withTabBar
    ? TAB_BAR_CONTENT_HEIGHT + TAB_BAR_FAB_CLEARANCE + tabBarBottom
    : Math.max(insets.bottom, 16);

  return {
    insets,
    scrollBottomPadding,
    tabBarBottom
  };
}
