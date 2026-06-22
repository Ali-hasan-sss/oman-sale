'use client';

import { useResendCountdown } from '@/components/auth/use-resend-countdown';

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
      <p className="text-center text-sm font-bold text-gray-400">{countdownLabel(secondsLeft)}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={() => handleResend('whatsapp')}
        disabled={disabled}
        className="flex-1 rounded-lg border border-green-600 bg-white px-4 py-2.5 text-sm font-bold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {resendViaWhatsappLabel}
      </button>
      <button
        type="button"
        onClick={() => handleResend('sms')}
        disabled={disabled}
        className="flex-1 rounded-lg border border-green-600 bg-white px-4 py-2.5 text-sm font-bold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {resendViaSmsLabel}
      </button>
    </div>
  );
}
