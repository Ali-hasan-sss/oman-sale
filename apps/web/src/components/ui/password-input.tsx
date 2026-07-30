'use client';

import { Eye, EyeOff } from 'lucide-react';
import { InputHTMLAttributes, useState } from 'react';

import { useI18n } from '@/lib/i18n';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  containerClassName?: string;
};

export function PasswordInput({ className = '', containerClassName = '', disabled, ...props }: PasswordInputProps) {
  const { m } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${containerClassName}`}>
      <input
        {...props}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        className={`${className} pe-11`.trim()}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? m.common.hidePassword : m.common.showPassword}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:opacity-50"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
