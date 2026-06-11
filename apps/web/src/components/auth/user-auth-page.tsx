'use client';

import { isAxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { VerificationCodeInput } from '@/components/auth/verification-code-input';
import { SiteFooter } from '@/components/home/site-footer';
import { UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { ApiErrorCodes, getApiErrorCode, resolveApiErrorMessage } from '@/lib/api-errors';
import { getAuthMessages, useI18n } from '@/lib/i18n';
import { syncCurrentUser } from '@/lib/sync-current-user';
import { saveUserSession, type UserAuthSession } from '@/lib/user-auth';
import { notifyAuthChanged } from '@/components/auth/user-menu';
import { useAuthStore } from '@/store/auth-store';

type AuthMode = 'login' | 'register';

type UserAuthPageProps = {
  mode: AuthMode;
};

const emailVerificationRequiredMessage = 'Email verification required';

const buildErrorMessages = (errors: {
  ACCOUNT_BLOCKED: string;
  ACCOUNT_INACTIVE: string;
  EMAIL_VERIFICATION_REQUIRED: string;
}) => ({
  ACCOUNT_BLOCKED: errors.ACCOUNT_BLOCKED,
  ACCOUNT_INACTIVE: errors.ACCOUNT_INACTIVE,
  EMAIL_VERIFICATION_REQUIRED: errors.EMAIL_VERIFICATION_REQUIRED
});

export function UserAuthPage({ mode }: UserAuthPageProps) {
  const router = useRouter();
  const { dir, locale, localizedPath, m } = useI18n();
  const setSession = useAuthStore((state) => state.setSession);
  const authMessages = getAuthMessages(locale);
  const isRegister = mode === 'register';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const submittedEmail = email.trim();
      const payload = isRegister
        ? { fullName, email: submittedEmail, phone, password, locale }
        : { email: submittedEmail, password };
      const response = await api.post<{ data: UserAuthSession | { email: string; pendingVerification: true } }>(`/auth/${isRegister ? 'register' : 'login'}`, payload);

      if (isRegister && 'pendingVerification' in response.data.data) {
        setPendingVerificationEmail(response.data.data.email);
        return;
      }

      const session = response.data.data as UserAuthSession;

      if (rememberMe || isRegister) {
        saveUserSession(session);
      }

      setSession({
        accessToken: session.tokens.accessToken,
        user: session.user
      });
      notifyAuthChanged();
      await syncCurrentUser(session.tokens.accessToken);
      router.push(localizedPath('/'));
    } catch (error) {
      if (
        !isRegister &&
        (getApiErrorCode(error) === ApiErrorCodes.EMAIL_VERIFICATION_REQUIRED ||
          (isAxiosError<{ message?: string }>(error) && error.response?.data.message === emailVerificationRequiredMessage))
      ) {
        try {
          const submittedEmail = email.trim();
          await api.post('/auth/resend-verification', { email: submittedEmail, locale });
          setVerificationCode('');
          setPendingVerificationEmail(submittedEmail);
        } catch {
          setError(authMessages.loginError);
        }
        return;
      }

      setError(
        resolveApiErrorMessage(
          error,
          buildErrorMessages(m.errors),
          isRegister ? authMessages.registerError : authMessages.loginError
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyEmail = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post<{ data: UserAuthSession }>('/auth/verify-email', {
        email: pendingVerificationEmail,
        code: verificationCode
      });
      saveUserSession(response.data.data);
      setSession({ accessToken: response.data.data.tokens.accessToken, user: response.data.data.user });
      notifyAuthChanged();
      await syncCurrentUser(response.data.data.tokens.accessToken);
      router.push(localizedPath('/'));
    } catch {
      setError(authMessages.verifyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="top" className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">{isRegister ? authMessages.registerTitle : authMessages.loginTitle}</h1>
            <p className="text-gray-600">{isRegister ? authMessages.registerSubtitle : authMessages.loginSubtitle}</p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            {pendingVerificationEmail ? (
              <div>
                <h2 className="mb-2 text-center text-2xl font-black">{authMessages.verifyTitle}</h2>
                <p className="mb-6 text-center text-sm text-gray-600">{authMessages.verifySubtitle}</p>
                <VerificationCodeInput value={verificationCode} onChange={setVerificationCode} disabled={isSubmitting} />
                {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
                <button
                  type="button"
                  onClick={verifyEmail}
                  disabled={isSubmitting || verificationCode.length !== 6}
                  className="mt-6 w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
                >
                  {isSubmitting ? authMessages.submitting : authMessages.verifyButton}
                </button>
                <button
                  type="button"
                  onClick={() => api.post('/auth/resend-verification', { email: pendingVerificationEmail, locale })}
                  className="mt-3 w-full text-sm font-bold text-green-700"
                >
                  {authMessages.resendCode}
                </button>
              </div>
            ) : (
            <form onSubmit={submit}>
              {isRegister ? (
                <div className="mb-4">
                  <label className="mb-2 block">{authMessages.fullName}</label>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    placeholder={authMessages.fullNamePlaceholder}
                    className={inputClass}
                  />
                </div>
              ) : null}

              <div className="mb-4">
                <label className="mb-2 block">{authMessages.email}</label>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="example@email.com"
                  className={inputClass}
                />
              </div>

              {isRegister ? (
                <div className="mb-4">
                  <label className="mb-2 block">{authMessages.phone}</label>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    type="tel"
                    name="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    placeholder="+968 9123 4567"
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
              ) : null}

              <div className="mb-6">
                <label className="mb-2 block">{authMessages.password}</label>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  name={isRegister ? 'new-password' : 'current-password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  minLength={isRegister ? 8 : undefined}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              {!isRegister ? (
                <div className="mb-6 flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      type="checkbox"
                      className="h-4 w-4 text-green-600"
                    />
                    <span className="text-sm">{authMessages.rememberMe}</span>
                  </label>
                  <Link href={localizedPath('/forgot-password')} className="text-sm text-green-600 hover:text-green-700">
                    {authMessages.forgotPassword}
                  </Link>
                </div>
              ) : null}

              {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mb-4 w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? authMessages.submitting : isRegister ? authMessages.registerButton : authMessages.loginButton}
              </button>

              <div className="text-center">
                <Link href={localizedPath(isRegister ? '/login' : '/register')} className="text-sm text-gray-600">
                  {isRegister ? authMessages.hasAccount : authMessages.noAccount}{' '}
                  <span className="font-bold text-green-600 hover:text-green-700">
                    {isRegister ? authMessages.loginNow : authMessages.registerNow}
                  </span>
                </Link>
              </div>
            </form>
            )}

            {!pendingVerificationEmail ? <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="mb-4 text-center text-sm text-gray-600">{authMessages.socialLogin}</p>
              <div className="grid grid-cols-2 gap-4">
                <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition hover:bg-gray-50" type="button">
                  Google
                </button>
                <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition hover:bg-gray-50" type="button">
                  Facebook
                </button>
              </div>
            </div> : null}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
