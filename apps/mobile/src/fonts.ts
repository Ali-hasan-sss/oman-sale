import {
  Cairo_200ExtraLight,
  Cairo_300Light,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
  Cairo_900Black
} from '@expo-google-fonts/cairo';
import {
  Poppins_200ExtraLight,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import type { TextStyle } from 'react-native';

import type { Locale } from './types';

/** Keys match `fontFamily` after `expo-font` load (same as export names). */
export const appFontAssets = {
  Cairo_200ExtraLight,
  Cairo_300Light,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
  Cairo_900Black,
  Poppins_200ExtraLight,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black
} as const;

const cairoFaces = ['Cairo_200ExtraLight', 'Cairo_300Light', 'Cairo_400Regular', 'Cairo_500Medium', 'Cairo_600SemiBold', 'Cairo_700Bold', 'Cairo_800ExtraBold', 'Cairo_900Black'] as const;

const poppinsFaces = [
  'Poppins_200ExtraLight',
  'Poppins_300Light',
  'Poppins_400Regular',
  'Poppins_500Medium',
  'Poppins_600SemiBold',
  'Poppins_700Bold',
  'Poppins_800ExtraBold',
  'Poppins_900Black'
] as const;

type CairoFace = (typeof cairoFaces)[number];
type PoppinsFace = (typeof poppinsFaces)[number];

function normalizeWeight(weight?: TextStyle['fontWeight']): number {
  if (weight === undefined || weight === 'normal') return 400;
  if (weight === 'bold') return 700;
  if (weight === '100') return 100;
  if (weight === '200') return 200;
  if (weight === '300') return 300;
  if (weight === '400') return 400;
  if (weight === '500') return 500;
  if (weight === '600') return 600;
  if (weight === '700') return 700;
  if (weight === '800') return 800;
  if (weight === '900') return 900;
  if (typeof weight === 'string') {
    const n = Number(weight);
    if (!Number.isNaN(n)) return n;
  }
  if (typeof weight === 'number' && Number.isFinite(weight)) return weight;
  return 400;
}

/** Pick static font file for numeric CSS weight buckets (Arabic → Cairo). */
function cairoFaceForNumericWeight(weight: number): CairoFace {
  if (weight <= 250) return 'Cairo_200ExtraLight';
  if (weight <= 350) return 'Cairo_300Light';
  if (weight <= 450) return 'Cairo_400Regular';
  if (weight <= 550) return 'Cairo_500Medium';
  if (weight <= 650) return 'Cairo_600SemiBold';
  if (weight <= 750) return 'Cairo_700Bold';
  if (weight <= 850) return 'Cairo_800ExtraBold';
  return 'Cairo_900Black';
}

/** English → Poppins static faces. */
function poppinsFaceForNumericWeight(weight: number): PoppinsFace {
  if (weight <= 250) return 'Poppins_200ExtraLight';
  if (weight <= 350) return 'Poppins_300Light';
  if (weight <= 450) return 'Poppins_400Regular';
  if (weight <= 550) return 'Poppins_500Medium';
  if (weight <= 650) return 'Poppins_600SemiBold';
  if (weight <= 750) return 'Poppins_700Bold';
  if (weight <= 850) return 'Poppins_800ExtraBold';
  return 'Poppins_900Black';
}

/**
 * Registered name for expo-font (`fontFamily` on Text / TextInput).
 * Weight selects the matching static Cairo or Poppins file.
 */
export function fontFamilyForLocale(locale: Locale, weight?: TextStyle['fontWeight']): string {
  const w = normalizeWeight(weight);
  return locale === 'ar' ? cairoFaceForNumericWeight(w) : poppinsFaceForNumericWeight(w);
}

export function useAppFonts() {
  return useFonts(appFontAssets as Record<string, number>);
}
