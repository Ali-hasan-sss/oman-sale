import { forwardRef } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  type NativeSyntheticEvent,
  type TargetedEvent,
  type TextInputProps,
  type TextStyle
} from 'react-native';

import { useKeyboardAwareScrollHandler } from './KeyboardAwareScrollView';
import { useI18n } from '../i18n';
import { fontFamilyForLocale } from '../fonts';
import { colors } from '../theme';

export const AppTextInput = forwardRef<TextInput, TextInputProps>(function AppTextInput(
  { style, placeholderTextColor, onFocus, ...rest },
  ref
) {
  const scrollIntoView = useKeyboardAwareScrollHandler();
  const { locale } = useI18n();
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const resolvedStyle: TextStyle[] = [
    !flat?.color ? { color: colors.ink } : null,
    style,
    flat?.fontFamily ? null : { fontFamily: fontFamilyForLocale(locale, flat?.fontWeight), fontWeight: 'normal' }
  ].filter(Boolean) as TextStyle[];

  const handleFocus = (event: NativeSyntheticEvent<TargetedEvent>) => {
    scrollIntoView?.(event);
    onFocus?.(event);
  };

  return (
    <TextInput
      ref={ref}
      style={resolvedStyle}
      placeholderTextColor={placeholderTextColor ?? colors.muted}
      keyboardAppearance="light"
      onFocus={handleFocus}
      {...(Platform.OS === 'android' ? { importantForAutofill: 'noExcludeDescendants' as const } : {})}
      {...rest}
    />
  );
});
