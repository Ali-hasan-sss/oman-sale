import { memo } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Pattern, Rect, Stop, ClipPath, Text as SvgText } from 'react-native-svg';

import { OMAN_CITIES, OMAN_PATH } from '../../lib/oman-map';

/** Cities that sit right under the headline: keep their dots, drop the labels. */
const HIDDEN_LABELS = new Set(['Khasab', 'Sohar', 'Ibri']);

type OmanMapSvgProps = {
  width: number;
  height: number;
  locale: string;
};

/** Faint glowing outline of Oman with city dots, drawn behind the hero ring (light theme). */
export const OmanMapSvg = memo(function OmanMapSvg({ width, height, locale }: OmanMapSvgProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 600 700" preserveAspectRatio="xMidYMin meet">
      <Defs>
        <LinearGradient id="omanFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3fd3ef" stopOpacity={0.16} />
          <Stop offset="0.6" stopColor="#197fff" stopOpacity={0.07} />
          <Stop offset="1" stopColor="#197fff" stopOpacity={0.02} />
        </LinearGradient>
        <Pattern id="omanDots" width="9" height="9" patternUnits="userSpaceOnUse">
          <Circle cx="4.5" cy="4.5" r="1" fill="#0891b2" fillOpacity={0.28} />
        </Pattern>
        <ClipPath id="omanClip">
          <Path d={OMAN_PATH} />
        </ClipPath>
      </Defs>
      <Path d={OMAN_PATH} fill="url(#omanFill)" />
      <Rect width="600" height="700" fill="url(#omanDots)" clipPath="url(#omanClip)" />
      {/* soft glow: a wide faint stroke under the crisp one */}
      <Path d={OMAN_PATH} fill="none" stroke="#3fd3ef" strokeOpacity={0.25} strokeWidth={7} strokeLinejoin="round" />
      <Path d={OMAN_PATH} fill="none" stroke="#0aa2c2" strokeOpacity={0.85} strokeWidth={1.8} strokeLinejoin="round" />
      {OMAN_CITIES.map((city) => (
        <G key={city.key} x={city.x} y={city.y}>
          <Circle r={9} fill="none" stroke="rgba(8,145,178,0.35)" strokeWidth={1.5} />
          <Circle r={3.6} fill="#0891b2" />
          {HIDDEN_LABELS.has(city.key) ? null : (
            <>
              {/* white halo first, then the label on top (paint-order isn't supported) */}
              <SvgText x={9} y={5} fontSize={15} fontWeight="700" fill="#ffffff" stroke="#ffffff" strokeWidth={3}>
                {locale === 'en' ? city.en : city.ar}
              </SvgText>
              <SvgText x={9} y={5} fontSize={15} fontWeight="700" fill="#0b3b4a">
                {locale === 'en' ? city.en : city.ar}
              </SvgText>
            </>
          )}
        </G>
      ))}
    </Svg>
  );
});
