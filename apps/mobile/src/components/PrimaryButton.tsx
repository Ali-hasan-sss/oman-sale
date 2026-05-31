import { ActivityIndicator, Platform, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { colors, radius } from '../theme';

const BUTTON_MIN_HEIGHT = 52;
const LABEL_FONT_SIZE = 16;
const LABEL_LINE_HEIGHT = 20;

type PrimaryButtonVariant = 'solid' | 'soft';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: PrimaryButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'solid',
  style
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const isSoft = variant === 'soft';

  return (
    <Pressable
      style={[
        styles.button,
        isSoft ? styles.buttonSoft : styles.buttonSolid,
        isDisabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={isSoft ? colors.brandDark : '#fff'} />
      ) : (
        <AppText style={[styles.label, isSoft && styles.labelSoft]}>{label}</AppText>
      )}
    </Pressable>
  );
}

const labelBase = {
  fontWeight: '900' as const,
  fontSize: LABEL_FONT_SIZE,
  lineHeight: LABEL_LINE_HEIGHT,
  textAlign: 'center' as const,
  ...(Platform.OS === 'android'
    ? { includeFontPadding: false, textAlignVertical: 'center' as const }
    : {})
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    minHeight: BUTTON_MIN_HEIGHT,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonSolid: {
    backgroundColor: colors.brand
  },
  buttonSoft: {
    backgroundColor: colors.brandSoft
  },
  disabled: {
    opacity: 0.7
  },
  label: {
    ...labelBase,
    color: '#fff'
  },
  labelSoft: {
    color: colors.brandDark
  }
});
