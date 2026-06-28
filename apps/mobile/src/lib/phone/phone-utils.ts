import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, type PhoneCountry } from './countries';

export function getCountryByCode(code: string): PhoneCountry | undefined {
  return PHONE_COUNTRIES.find((country) => country.code === code);
}

export function getCountryName(country: PhoneCountry, locale: 'ar' | 'en') {
  return locale === 'ar' ? country.nameAr : country.nameEn;
}

export function normalizeNationalDigits(country: PhoneCountry, raw: string) {
  let digits = raw.replace(/\D/g, '');
  if (country.stripLeadingZero && digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }
  return digits;
}

export function formatPhoneE164(country: PhoneCountry, nationalDigits: string) {
  const digits = normalizeNationalDigits(country, nationalDigits);
  if (!digits) return '';
  return `+${country.dialCode}${digits}`;
}

export function isValidPhoneE164(value: string) {
  return /^\+[1-9]\d{6,14}$/.test(value);
}

export function parsePhoneValue(value: string) {
  const cleaned = value.replace(/[\s()-]/g, '');
  if (!cleaned) {
    return { countryCode: DEFAULT_PHONE_COUNTRY, nationalNumber: '' };
  }

  const digits = cleaned.replace(/\D/g, '');
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

  if (cleaned.startsWith('+')) {
    for (const country of sorted) {
      if (cleaned.startsWith(`+${country.dialCode}`)) {
        return {
          countryCode: country.code,
          nationalNumber: cleaned.slice(country.dialCode.length + 1).replace(/\D/g, '')
        };
      }
    }
  } else {
    for (const country of sorted) {
      if (digits.startsWith(country.dialCode)) {
        return {
          countryCode: country.code,
          nationalNumber: digits.slice(country.dialCode.length)
        };
      }
    }
  }

  return { countryCode: DEFAULT_PHONE_COUNTRY, nationalNumber: digits };
}
