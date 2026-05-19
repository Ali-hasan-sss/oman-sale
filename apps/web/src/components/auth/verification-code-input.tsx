'use client';

import { ClipboardEvent, KeyboardEvent, useRef } from 'react';

export function VerificationCodeInput({ disabled, onChange, value }: { disabled?: boolean; onChange: (value: string) => void; value: string }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '');

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join('').trim());
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const code = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(code);
    refs.current[Math.min(code.length, 5)]?.focus();
  };

  const keyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div dir="rtl" className="grid grid-cols-6 gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          disabled={disabled}
          inputMode="numeric"
          maxLength={1}
          onPaste={paste}
          onKeyDown={(event) => keyDown(event, index)}
          onChange={(event) => setDigit(index, event.target.value.replace(/\D/g, '').slice(-1))}
          className="h-14 rounded-xl border border-gray-300 text-center text-2xl font-black outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
      ))}
    </div>
  );
}
