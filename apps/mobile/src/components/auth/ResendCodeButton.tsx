import { Pressable, StyleSheet } from 'react-native';

import { useResendCountdown } from '../../hooks/use-resend-countdown';
import { AppText } from '../AppText';
import { colors } from '../../theme';

type ResendCodeButtonProps = {
  disabled?: boolean;
  label: string;
  countdownLabel: (seconds: number) => string;
  onResend: () => Promise<void>;
  initialCountdown?: number;
};

export function ResendCodeButton({
  disabled,
  label,
  countdownLabel,
  onResend,
  initialCountdown = 60
}: ResendCodeButtonProps) {
  const { secondsLeft, canResend, start } = useResendCountdown(initialCountdown);

  const handleResend = async () => {
    if (!canResend || disabled) return;
    await onResend();
    start(initialCountdown);
  };

  return (
    <Pressable onPress={handleResend} disabled={disabled || !canResend} style={styles.button}>
      <AppText style={[styles.text, (!canResend || disabled) && styles.textMuted]}>
        {canResend ? label : countdownLabel(secondsLeft)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 12,
    alignItems: 'center'
  },
  text: {
    color: colors.brand,
    fontWeight: '800',
    fontSize: 14
  },
  textMuted: {
    color: colors.muted
  }
});
