import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

/** Flag of Oman (simplified emblem) — emoji flags don't render on every Android. */
export function OmanFlag({ width = 36 }: { width?: number }) {
  return (
    <Svg width={width} height={(width * 2) / 3} viewBox="0 0 30 20" style={{ borderRadius: 4 }}>
      <Rect width="30" height="20" fill="#fff" />
      <Rect y="13.33" width="30" height="6.67" fill="#008000" />
      <Rect y="6.67" width="30" height="6.67" fill="#db161b" />
      <Rect width="8" height="20" fill="#db161b" />
      <G transform="translate(4 4.2) scale(0.32)" fill="#fff">
        <Path d="M-4.5-6.5l9 13M4.5-6.5l-9 13" stroke="#fff" strokeWidth={2} />
        <Path d="M-1.5-9h3v8h-3z" />
        <Circle r={2.6} />
      </G>
    </Svg>
  );
}
