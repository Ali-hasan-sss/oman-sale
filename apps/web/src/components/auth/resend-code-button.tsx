'use client';

import { useResendCountdown } from '@/components/auth/use-resend-countdown';

type ResendCodeButtonProps = {
  disabled?: boolean;
  label: string;
  countdownLabel: (seconds: number) => string;
  onResend: () => Promise<void>;
  initialCountdown?: number;
};

export function ResendCodeButton({ disabled, label, countdownLabel, onResend, initialCountdown = 60 }: ResendCodeButtonProps) {
  const { secondsLeft, canResend, start } = useResendCountdown(initialCountdown);

  const handleResend = async () => {
    if (!canResend || disabled) return;
    await onResend();
    start(initialCountdown);
  };

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={disabled || !canResend}
      className="w-full text-sm font-bold text-green-700 disabled:cursor-not-allowed disabled:text-gray-400"
    >
      {canResend ? label : countdownLabel(secondsLeft)}
    </button>
  );
}
