import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from './AppText';
import { colors, radius } from '../theme';

type VerificationCodeInputProps = {
  disabled?: boolean;
  isRtl?: boolean;
  onChange: (value: string) => void;
  value: string;
};

const CODE_LENGTH = 6;

export function VerificationCodeInput({ disabled, onChange, value }: VerificationCodeInputProps) {
  const inputRef = useRef<TextInput | null>(null);
  const [focused, setFocused] = useState(false);
  const digits = Array.from({ length: CODE_LENGTH }, (_, index) => value[index] ?? '');
  const activeIndex = Math.min(value.length, CODE_LENGTH - 1);

  const handleChange = (text: string) => {
    const code = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    onChange(code);
  };

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {digits.map((digit, index) => {
        const isActive = focused && index === activeIndex && value.length < CODE_LENGTH;
        const isFilledActive = focused && value.length === CODE_LENGTH && index === CODE_LENGTH - 1;
        return (
          <View
            key={index}
            style={[
              styles.cell,
              (isActive || isFilledActive) && styles.cellActive,
              disabled && styles.cellDisabled
            ]}
          >
            <AppText style={styles.cellText}>{digit}</AppText>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        editable={!disabled}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={CODE_LENGTH}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardAppearance="light"
        style={styles.hiddenInput}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    writingDirection: 'ltr',
    position: 'relative'
  },
  cell: {
    flex: 1,
    minWidth: 44,
    height: 56,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cellActive: {
    borderColor: colors.brand,
    borderWidth: 2
  },
  cellDisabled: {
    opacity: 0.6
  },
  cellText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent'
  }
});
