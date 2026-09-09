import { I18nManager, type FlexStyle, type TextStyle } from 'react-native';

function matchesNative(isRtl: boolean) {
  return I18nManager.isRTL === isRtl;
}

/**
 * Row direction that stays correct whether or not the native I18nManager
 * is already mirroring `flexDirection`.
 */
export function rowDirection(isRtl: boolean): Pick<FlexStyle, 'flexDirection'> {
  return { flexDirection: matchesNative(isRtl) ? 'row' : 'row-reverse' };
}

/**
 * Locale start alignment that stays correct on Android when I18nManager
 * already maps `left`/`right` (and `start`/`end`) to the device language.
 */
export function resolveTextAlign(
  align: TextStyle['textAlign'] | undefined,
  isRtl: boolean
): TextStyle['textAlign'] {
  if (align === 'center' || align === 'justify' || align === 'auto') return align;
  if (align === 'left') return I18nManager.isRTL ? 'end' : 'start';
  if (align === 'right') return I18nManager.isRTL ? 'start' : 'end';
  if (align === 'end') return I18nManager.isRTL === isRtl ? 'end' : 'start';
  return I18nManager.isRTL === isRtl ? 'start' : 'end';
}

export function textDirection(
  isRtl: boolean,
  align?: TextStyle['textAlign']
): Pick<TextStyle, 'textAlign' | 'writingDirection'> {
  return {
    textAlign: resolveTextAlign(align, isRtl),
    writingDirection: isRtl ? 'rtl' : 'ltr'
  };
}

export function alignSelfStart(isRtl: boolean): Pick<FlexStyle, 'alignSelf'> {
  return { alignSelf: matchesNative(isRtl) ? 'flex-start' : 'flex-end' };
}

export function alignSelfEnd(isRtl: boolean): Pick<FlexStyle, 'alignSelf'> {
  return { alignSelf: matchesNative(isRtl) ? 'flex-end' : 'flex-start' };
}

export function itemsAlignStart(isRtl: boolean): Pick<FlexStyle, 'alignItems'> {
  return { alignItems: matchesNative(isRtl) ? 'flex-start' : 'flex-end' };
}

/** Physical start inset — `left`/`right` are not mirrored by I18nManager. */
export function insetStart(isRtl: boolean, value: number): { left?: number; right?: number } {
  return isRtl ? { right: value } : { left: value };
}

export function insetEnd(isRtl: boolean, value: number): { left?: number; right?: number } {
  return isRtl ? { left: value } : { right: value };
}

/** Horizontal lists that used row-reverse to fake locale direction need scrollToEnd. */
export function horizontalListNeedsAlignStart(isRtl: boolean) {
  return !matchesNative(isRtl);
}
