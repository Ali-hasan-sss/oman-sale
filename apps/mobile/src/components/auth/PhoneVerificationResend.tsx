import { Pressable, StyleSheet, View } from 'react-native';

import { useResendCountdown } from '../../hooks/use-resend-countdown';
import { AppText } from '../AppText';
import { colors, radius } from '../../theme';

export type PhoneVerificationChannel = 'whatsapp' | 'sms';

type PhoneVerificationResendProps = {
  disabled?: boolean;
  onSend: (channel: PhoneVerificationChannel) => Promise<void>;
  onChannelChange: (channel: PhoneVerificationChannel) => void;
  countdownLabel: (seconds: number) => string;
  resendViaWhatsappLabel: string;
  resendViaSmsLabel: string;
  initialCountdown?: number;
};

export function PhoneVerificationResend({
  disabled,
  onSend,
  onChannelChange,
  countdownLabel,
  resendViaWhatsappLabel,
  resendViaSmsLabel,
  initialCountdown = 60
}: PhoneVerificationResendProps) {
  const { secondsLeft, canResend, start } = useResendCountdown(initialCountdown);

  const handleResend = async (channel: PhoneVerificationChannel) => {
    if (!canResend || disabled) return;
    onChannelChange(channel);
    await onSend(channel);
    start(initialCountdown);
  };

  if (!canResend) {
    return (
      <AppText style={styles.countdown}>{countdownLabel(secondsLeft)}</AppText>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.channelButton, disabled && styles.disabled]}
        onPress={() => handleResend('whatsapp')}
        disabled={disabled}
      >
        <AppText style={styles.channelLabel}>{resendViaWhatsappLabel}</AppText>
      </Pressable>
      <Pressable
        style={[styles.channelButton, disabled && styles.disabled]}
        onPress={() => handleResend('sms')}
        disabled={disabled}
      >
        <AppText style={styles.channelLabel}>{resendViaSmsLabel}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  countdown: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '700',
    fontSize: 14
  },
  row: {
    marginTop: 12,
    gap: 8
  },
  channelButton: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center'
  },
  disabled: {
    opacity: 0.7
  },
  channelLabel: {
    color: colors.brandDark,
    fontWeight: '800',
    fontSize: 14
  }
});
