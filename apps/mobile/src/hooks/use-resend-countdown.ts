import { useCallback, useEffect, useState } from 'react';

const DEFAULT_SECONDS = 60;

export function useResendCountdown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  const start = useCallback((seconds = DEFAULT_SECONDS) => {
    setSecondsLeft(seconds);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return { secondsLeft, canResend: secondsLeft <= 0, start };
}
