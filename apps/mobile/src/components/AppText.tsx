import { forwardRef } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useI18n } from '../i18n';
import { fontFamilyForLocale } from '../fonts';
import { textDirection } from '../lib/layout-direction';

/** App typography: Cairo (AR) / Poppins (EN); respects merged `fontWeight` from style. */
export const AppText = forwardRef<Text, TextProps>(function AppText({ style, ...rest }, ref) {
  const { locale, isRtl } = useI18n();
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const directionStyle: TextStyle = {
    ...textDirection(isRtl, flat?.textAlign),
    ...(flat?.writingDirection ? { writingDirection: flat.writingDirection } : null)
  };
  if (flat?.fontFamily) {
    return <Text ref={ref} style={[style, directionStyle]} {...rest} />;
  }
  const family = fontFamilyForLocale(locale, flat?.fontWeight);
  return (
    <Text
      ref={ref}
      style={[style, directionStyle, { fontFamily: family, fontWeight: 'normal' as const }]}
      {...rest}
    />
  );
});
