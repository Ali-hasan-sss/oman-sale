'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { VerificationCodeInput } from '@/components/auth/verification-code-input';
import { api } from '@/lib/api';
import { getAuthMessages, useI18n } from '@/lib/i18n';

export function PasswordResetPage() {
  const router = useRouter();
  const { dir, locale, localizedPath } = useI18n();
  const messages = getAuthMessages(locale);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email, locale });
      setSent(true);
    } catch {
      setError(messages.resetPasswordError);
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { email, code, password });
      setSuccess(messages.resetPasswordSuccess);
      setTimeout(() => router.push(localizedPath('/login')), 900);
    } catch {
      setError(messages.resetPasswordError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4" dir={dir}>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-black">{sent ? messages.resetPasswordTitle : messages.forgotPasswordTitle}</h1>
        <p className="mb-6 text-center text-gray-600">{sent ? messages.resetPasswordSubtitle : messages.forgotPasswordSubtitle}</p>
        <form onSubmit={sent ? resetPassword : requestCode} className="space-y-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="example@email.com" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500" />
          {sent ? (
            <>
              <VerificationCodeInput value={code} onChange={setCode} disabled={submitting} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} placeholder={messages.newPassword} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500" />
            </>
          ) : null}
          {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
          {success ? <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{success}</p> : null}
          <button disabled={submitting || (sent && code.length !== 6)} className="w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white disabled:opacity-70">
            {submitting ? messages.submitting : sent ? messages.resetPasswordButton : messages.sendResetCode}
          </button>
        </form>
        <Link href={localizedPath('/login')} className="mt-5 block text-center text-sm font-bold text-green-700">
          {messages.loginNow}
        </Link>
      </div>
    </main>
  );
}
