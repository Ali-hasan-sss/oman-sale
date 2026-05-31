import { Platform } from 'react-native';

/** Manual keyboard lift for scroll forms (iOS). Chat composer uses useComposerKeyboardLift. */
export function usesManualKeyboardLift() {
  return Platform.OS === 'ios';
}
