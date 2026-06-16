'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { countryFlag } from '@/lib/phone/country-flag';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, type PhoneCountry } from '@/lib/phone/countries';
import {
  formatPhoneE164,
  getCountryByCode,
  getCountryName,
  normalizeNationalDigits,
  parsePhoneValue
} from '@/lib/phone/phone-utils';
import type { Locale } from '@/lib/i18n';

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  name?: string;
};

export function PhoneInput({
  value,
  onChange,
  locale,
  disabled,
  required,
  placeholder,
  searchPlaceholder,
  className = '',
  name = 'tel'
}: PhoneInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_PHONE_COUNTRY);
  const [nationalNumber, setNationalNumber] = useState('');

  const selectedCountry =
    getCountryByCode(countryCode) ?? getCountryByCode(DEFAULT_PHONE_COUNTRY) ?? PHONE_COUNTRIES[0]!;

  useEffect(() => {
    const parsed = parsePhoneValue(value);
    setCountryCode(parsed.countryCode);
    setNationalNumber(parsed.nationalNumber);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return PHONE_COUNTRIES;

    return PHONE_COUNTRIES.filter((country) => {
      const name = getCountryName(country, locale).toLowerCase();
      return (
        name.includes(query) ||
        country.nameEn.toLowerCase().includes(query) ||
        country.nameAr.includes(search.trim()) ||
        country.code.toLowerCase().includes(query) ||
        country.dialCode.includes(query) ||
        `+${country.dialCode}`.includes(query)
      );
    });
  }, [locale, search]);

  const emitChange = (country: PhoneCountry, nextNationalNumber: string) => {
    onChange(formatPhoneE164(country, nextNationalNumber));
  };

  const selectCountry = (country: PhoneCountry) => {
    setCountryCode(country.code);
    setOpen(false);
    setSearch('');
    emitChange(country, nationalNumber);
  };

  const handleNationalChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const normalized = normalizeNationalDigits(selectedCountry, digits);
    setNationalNumber(normalized);
    emitChange(selectedCountry, normalized);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} dir="ltr">
      <div
        className={`flex overflow-hidden rounded-lg border border-gray-300 bg-white transition focus-within:ring-2 focus-within:ring-green-500 ${
          disabled ? 'cursor-not-allowed bg-gray-50 opacity-70' : ''
        }`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className="flex shrink-0 items-center gap-1.5 border-r border-gray-300 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="text-lg leading-none" aria-hidden>
            {countryFlag(selectedCountry.code)}
          </span>
          <span className="whitespace-nowrap">+{selectedCountry.dialCode}</span>
          <ChevronDown size={16} className={`text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
        </button>

        <input
          type="tel"
          name={name}
          value={nationalNumber}
          onChange={(event) => handleNationalChange(event.target.value)}
          disabled={disabled}
          required={required}
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={placeholder ?? (selectedCountry.code === 'OM' ? '9123 4567' : '')}
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm outline-none disabled:cursor-not-allowed"
        />
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder ?? (locale === 'ar' ? 'بحث عن دولة...' : 'Search country...')}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                autoFocus
              />
            </div>
          </div>

          <div role="listbox" className="max-h-64 overflow-y-auto p-1">
            {filteredCountries.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">
                {locale === 'ar' ? 'لا توجد نتائج' : 'No results'}
              </p>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  role="option"
                  aria-selected={country.code === selectedCountry.code}
                  onClick={() => selectCountry(country)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-green-50 ${
                    country.code === selectedCountry.code ? 'bg-green-50 font-bold text-green-800' : 'text-gray-800'
                  }`}
                >
                  <span className="text-xl leading-none">{countryFlag(country.code)}</span>
                  <span className="min-w-0 flex-1 truncate">{getCountryName(country, locale)}</span>
                  <span className="shrink-0 font-semibold text-gray-500">+{country.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
