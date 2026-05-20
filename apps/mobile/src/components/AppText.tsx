import { forwardRef } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useI18n } from '../i18n';
import { fontFamilyForLocale } from '../fonts';

/** App typography: Cairo (AR) / Poppins (EN); respects merged `fontWeight` from style. */
export const AppText = forwardRef<Text, TextProps>(function AppText({ style, ...rest }, ref) {
  const { locale } = useI18n();
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (flat?.fontFamily) {
    return <Text ref={ref} style={style} {...rest} />;
  }
  const family = fontFamilyForLocale(locale, flat?.fontWeight);
  return <Text ref={ref} style={[style, { fontFamily: family, fontWeight: 'normal' as const }]} {...rest} />;
});
