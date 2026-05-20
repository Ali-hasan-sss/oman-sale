import { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps, type TextStyle } from 'react-native';

import { useI18n } from '../i18n';
import { fontFamilyForLocale } from '../fonts';

export const AppTextInput = forwardRef<TextInput, TextInputProps>(function AppTextInput(
  { style, ...rest },
  ref
) {
  const { locale } = useI18n();
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (flat?.fontFamily) {
    return <TextInput ref={ref} style={style} {...rest} />;
  }
  const family = fontFamilyForLocale(locale, flat?.fontWeight);
  return <TextInput ref={ref} style={[style, { fontFamily: family, fontWeight: 'normal' as const }]} {...rest} />;
});
