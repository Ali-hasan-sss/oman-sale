import { useRef } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View
} from 'react-native';

import { colors, radius } from '../theme';

type VerificationCodeInputProps = {
  disabled?: boolean;
  isRtl?: boolean;
  onChange: (value: string) => void;
  value: string;
};

export function VerificationCodeInput({ disabled, isRtl = true, onChange, value }: VerificationCodeInputProps) {
  const refs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '');

  const focusCell = (index: number) => {
    refs.current[Math.max(0, Math.min(index, 5))]?.focus();
  };

  const applyCode = (raw: string, focusIndex?: number) => {
    const code = raw.replace(/\D/g, '').slice(0, 6);
    onChange(code);
    focusCell(focusIndex ?? Math.min(code.length, 5));
  };

  const setDigit = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length > 1) {
      applyCode(cleaned);
      return;
    }

    const next = digits.slice();
    next[index] = cleaned.slice(-1);
    const joined = next.join('').replace(/\s/g, '');
    onChange(joined);
    if (cleaned && index < 5) focusCell(index + 1);
  };

  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      focusCell(index - 1);
    }
  };

  return (
    <Pressable style={[styles.row, isRtl ? styles.rowRtl : styles.rowLtr]} onPress={() => focusCell(value.length >= 6 ? 5 : value.length)}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          editable={!disabled}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={6}
          textContentType={index === 0 ? 'oneTimeCode' : 'none'}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          selectTextOnFocus
          onChangeText={(text) => setDigit(index, text)}
          onKeyPress={(event) => handleKeyPress(event, index)}
          style={[styles.cell, disabled && styles.cellDisabled]}
        />
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    gap: 8
  },
  rowRtl: {
    flexDirection: 'row-reverse'
  },
  rowLtr: {
    flexDirection: 'row'
  },
  cell: {
    flex: 1,
    minWidth: 44,
    height: 56,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink
  },
  cellDisabled: {
    opacity: 0.6
  }
});
