import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View
} from 'react-native';

import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, type PhoneCountry } from '../lib/phone/countries';
import {
  formatPhoneE164,
  getCountryByCode,
  getCountryName,
  normalizeNationalDigits,
  parsePhoneValue
} from '../lib/phone/phone-utils';
import type { Locale } from '../types';
import { AppText } from './AppText';
import { colors, radius } from '../theme';

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  disabled?: boolean;
  searchPlaceholder?: string;
};

export function PhoneInput({ value, onChange, locale, disabled, searchPlaceholder }: PhoneInputProps) {
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

  const updatePhone = (country: PhoneCountry, digits: string) => {
    onChange(formatPhoneE164(country, digits));
  };

  const selectCountry = (country: PhoneCountry) => {
    setCountryCode(country.code);
    setOpen(false);
    setSearch('');
    updatePhone(country, nationalNumber);
  };

  const handleNationalChange = (raw: string) => {
    const digits = normalizeNationalDigits(selectedCountry, raw);
    setNationalNumber(digits);
    updatePhone(selectedCountry, digits);
  };

  const renderCountry = ({ item }: { item: PhoneCountry }) => (
    <Pressable style={styles.countryRow} onPress={() => selectCountry(item)}>
      <AppText style={styles.countryDial}>+{item.dialCode}</AppText>
      <AppText style={styles.countryName}>{getCountryName(item, locale)}</AppText>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <View style={styles.inputRow}>
        <Pressable
          style={[styles.countryButton, disabled && styles.disabled]}
          onPress={() => setOpen(true)}
          disabled={disabled}
        >
          <AppText style={styles.countryButtonText}>+{selectedCountry.dialCode}</AppText>
          <AppText style={styles.chevron}>▾</AppText>
        </Pressable>
        <TextInput
          value={nationalNumber}
          onChangeText={handleNationalChange}
          keyboardType="phone-pad"
          placeholder="91234567"
          editable={!disabled}
          style={styles.numberInput}
        />
      </View>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <AppText style={styles.modalTitle}>{searchPlaceholder ?? 'Search country'}</AppText>
            <Pressable onPress={() => setOpen(false)}>
              <AppText style={styles.close}>{locale === 'ar' ? 'إغلاق' : 'Close'}</AppText>
            </Pressable>
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={searchPlaceholder ?? 'Search country...'}
            style={styles.searchInput}
            autoFocus
          />
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={renderCountry}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 12
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minWidth: 96
  },
  countryButtonText: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 15
  },
  chevron: {
    color: colors.muted,
    fontSize: 12
  },
  numberInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink
  },
  disabled: {
    opacity: 0.7
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 48,
    paddingHorizontal: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink
  },
  close: {
    color: colors.brand,
    fontWeight: '800'
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: colors.ink
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  countryDial: {
    width: 64,
    fontWeight: '900',
    color: colors.brandDark
  },
  countryName: {
    flex: 1,
    color: colors.ink,
    fontWeight: '600'
  }
});
