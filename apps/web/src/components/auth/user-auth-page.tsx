'use client';

import { isAxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { ResendCodeButton } from '@/components/auth/resend-code-button';
import { RegisterStepper } from '@/components/auth/register-stepper';
import { VerificationCodeInput } from '@/components/auth/verification-code-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { SiteFooter } from '@/components/home/site-footer';
import { UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { ApiErrorCodes, getApiErrorCode, resolveApiErrorMessage } from '@/lib/api-errors';
import { signInWithGooglePopup } from '@/lib/google-auth';
import { getAuthMessages, useI18n } from '@/lib/i18n';
import { syncCurrentUser } from '@/lib/sync-current-user';
import { saveUser, saveUserSession, saveUserTokens, type UserAuthSession } from '@/lib/user-auth';
import { notifyAuthChanged } from '@/components/auth/user-menu';
import { useAuthStore } from '@/store/auth-store';
import { isValidPhoneE164 } from '@/lib/phone/phone-utils';

type AuthMode = 'login' | 'register';
type RegisterStep = 'info' | 'email-code' | 'phone' | 'phone-code' | 'password';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('info');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500';
  const submittedEmail = email.trim().toLowerCase();
  const submittedPhone = phone.trim();

  const registerSteps = [
    { label: authMessages.registerStepLabelInfo },
    { label: authMessages.registerStepLabelEmail },
    { label: authMessages.registerStepLabelPhone },
    { label: authMessages.registerStepLabelPassword }
  ];

  const finishAuthSession = async (session: UserAuthSession, persist = true) => {
    if (persist) {
      saveUserSession(session);
    } else {
      saveUserTokens(session.tokens);
      saveUser(session.user);
    }

    setSession({ accessToken: session.tokens.accessToken, user: session.user });
    notifyAuthChanged();
    const user = (await syncCurrentUser(session.tokens.accessToken)) ?? session.user;

    if (user.profileCompleted === false) {
      router.push(localizedPath('/complete-profile'));
      return;
    }

    router.push(localizedPath('/'));
  };

  const completeSession = async (session: UserAuthSession) => {
    await finishAuthSession(session);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const idToken = await signInWithGooglePopup();
      const response = await api.post<{ data: UserAuthSession }>('/auth/google', { idToken });
      await finishAuthSession(response.data.data);
    } catch (googleError) {
      if (googleError instanceof Error && googleError.message === 'FIREBASE_NOT_CONFIGURED') {
        setError(authMessages.googleNotConfigured);
        return;
      }
      setError(resolveApiErrorMessage(googleError, buildErrorMessages(m.errors), authMessages.googleSignInError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post<{ data: UserAuthSession }>('/auth/login', {
        email: submittedEmail,
        password
      });
      const session = response.data.data;

      if (rememberMe) {
        await finishAuthSession(session);
      } else {
        saveUserTokens(session.tokens);
        saveUser(session.user);
        setSession({ accessToken: session.tokens.accessToken, user: session.user });
        notifyAuthChanged();
        const user = (await syncCurrentUser(session.tokens.accessToken)) ?? session.user;
        router.push(user.profileCompleted === false ? localizedPath('/complete-profile') : localizedPath('/'));
      }
    } catch (loginError) {
      if (
        getApiErrorCode(loginError) === ApiErrorCodes.EMAIL_VERIFICATION_REQUIRED ||
        (isAxiosError<{ message?: string }>(loginError) &&
          loginError.response?.data.message === emailVerificationRequiredMessage)
      ) {
        try {
          await api.post('/auth/resend-verification', { email: submittedEmail, locale });
          setEmailCode('');
          setPendingVerificationEmail(submittedEmail);
        } catch {
          setError(authMessages.loginError);
        }
        return;
      }

      setError(resolveApiErrorMessage(loginError, buildErrorMessages(m.errors), authMessages.loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/auth/register/start', { fullName: fullName.trim(), email: submittedEmail, locale });
      setEmailCode('');
      setRegisterStep('email-code');
    } catch (startError) {
      setError(resolveApiErrorMessage(startError, buildErrorMessages(m.errors), authMessages.registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyRegistrationEmail = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/auth/register/verify-email', { email: submittedEmail, code: emailCode });
      setPhoneCode('');
      setRegisterStep('phone');
    } catch {
      setError(authMessages.verifyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPhoneCode = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!isValidPhoneE164(submittedPhone)) {
      setError(authMessages.phoneInvalid);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/auth/register/send-phone-code', { email: submittedEmail, phone: submittedPhone, locale });
      setPhoneCode('');
      setRegisterStep('phone-code');
    } catch (sendError) {
      setError(resolveApiErrorMessage(sendError, buildErrorMessages(m.errors), authMessages.registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyRegistrationPhone = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/auth/register/verify-phone', {
        email: submittedEmail,
        phone: submittedPhone,
        code: phoneCode
      });
      setRegisterStep('password');
    } catch {
      setError(authMessages.verifyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(authMessages.passwordMismatch);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post<{ data: UserAuthSession }>('/auth/register', {
        email: submittedEmail,
        phone: submittedPhone,
        password,
        locale
      });
      await completeSession(response.data.data);
    } catch (completeError) {
      setError(resolveApiErrorMessage(completeError, buildErrorMessages(m.errors), authMessages.registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyLegacyEmail = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post<{ data: UserAuthSession }>('/auth/verify-email', {
        email: pendingVerificationEmail,
        code: emailCode
      });
      await completeSession(response.data.data);
    } catch {
      setError(authMessages.verifyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRegisterStep = () => {
    if (registerStep === 'info') {
      return (
        <form onSubmit={startRegistration}>
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
          <div className="mb-6">
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
          {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? authMessages.submitting : authMessages.nextButton}
          </button>
        </form>
      );
    }

    if (registerStep === 'email-code') {
      return (
        <div>
          <h2 className="mb-2 text-center text-2xl font-black">{authMessages.verifyTitle}</h2>
          <p className="mb-6 text-center text-sm text-gray-600">{authMessages.verifySubtitle}</p>
          <VerificationCodeInput value={emailCode} onChange={setEmailCode} disabled={isSubmitting} />
          {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={verifyRegistrationEmail}
            disabled={isSubmitting || emailCode.length !== 6}
            className="mt-6 w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
          >
            {isSubmitting ? authMessages.submitting : authMessages.nextButton}
          </button>
          <div className="mt-3">
            <ResendCodeButton
              disabled={isSubmitting}
              label={authMessages.resendCode}
              countdownLabel={(seconds) => authMessages.resendInSeconds.replace('{seconds}', String(seconds))}
              onResend={async () => {
                await api.post('/auth/register/resend-email', { email: submittedEmail, locale });
              }}
            />
          </div>
        </div>
      );
    }

    if (registerStep === 'phone') {
      return (
        <form onSubmit={sendPhoneCode}>
          <div className="mb-6">
            <label className="mb-2 block">{authMessages.phone}</label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              locale={locale}
              disabled={isSubmitting}
              required
              searchPlaceholder={authMessages.searchCountry}
            />
          </div>
          {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? authMessages.submitting : authMessages.nextButton}
          </button>
        </form>
      );
    }

    if (registerStep === 'phone-code') {
      return (
        <div>
          <h2 className="mb-2 text-center text-2xl font-black">{authMessages.phoneVerifyTitle}</h2>
          <p className="mb-6 text-center text-sm text-gray-600">{authMessages.phoneVerifySubtitle}</p>
          <VerificationCodeInput value={phoneCode} onChange={setPhoneCode} disabled={isSubmitting} />
          {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={verifyRegistrationPhone}
            disabled={isSubmitting || phoneCode.length !== 6}
            className="mt-6 w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
          >
            {isSubmitting ? authMessages.submitting : authMessages.nextButton}
          </button>
          <div className="mt-3">
            <ResendCodeButton
              disabled={isSubmitting}
              label={authMessages.resendCode}
              countdownLabel={(seconds) => authMessages.resendInSeconds.replace('{seconds}', String(seconds))}
              onResend={async () => {
                await api.post('/auth/register/resend-phone', {
                  email: submittedEmail,
                  phone: submittedPhone,
                  locale
                });
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={completeRegistration}>
        <div className="mb-4">
          <label className="mb-2 block">{authMessages.password}</label>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            name="new-password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>
        <div className="mb-6">
          <label className="mb-2 block">{authMessages.confirmPassword}</label>
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>
        {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? authMessages.submitting : authMessages.registerButton}
        </button>
      </form>
    );
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
                <VerificationCodeInput value={emailCode} onChange={setEmailCode} disabled={isSubmitting} />
                {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
                <button
                  type="button"
                  onClick={verifyLegacyEmail}
                  disabled={isSubmitting || emailCode.length !== 6}
                  className="mt-6 w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
                >
                  {isSubmitting ? authMessages.submitting : authMessages.verifyButton}
                </button>
                <div className="mt-3">
                  <ResendCodeButton
                    disabled={isSubmitting}
                    label={authMessages.resendCode}
                    countdownLabel={(seconds) => authMessages.resendInSeconds.replace('{seconds}', String(seconds))}
                    onResend={async () => {
                      await api.post('/auth/resend-verification', { email: pendingVerificationEmail, locale });
                    }}
                  />
                </div>
              </div>
            ) : isRegister ? (
              <>
                <RegisterStepper
                  currentStep={registerStep}
                  steps={registerSteps}
                  ariaLabel={authMessages.registerStepsAriaLabel}
                />
                {renderRegisterStep()}
                <div className="mt-6 text-center">
                  <Link href={localizedPath('/login')} className="text-sm text-gray-600">
                    {authMessages.hasAccount}{' '}
                    <span className="font-bold text-green-600 hover:text-green-700">{authMessages.loginNow}</span>
                  </Link>
                </div>
              </>
            ) : (
              <form onSubmit={submitLogin}>
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

                <div className="mb-6">
                  <label className="mb-2 block">{authMessages.password}</label>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    name="current-password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>

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

                {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mb-4 w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? authMessages.submitting : authMessages.loginButton}
                </button>

                <div className="text-center">
                  <Link href={localizedPath('/register')} className="text-sm text-gray-600">
                    {authMessages.noAccount}{' '}
                    <span className="font-bold text-green-600 hover:text-green-700">{authMessages.registerNow}</span>
                  </Link>
                </div>
              </form>
            )}

            {!pendingVerificationEmail ? (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <p className="mb-4 text-center text-sm text-gray-600">
                  {isRegister ? authMessages.socialRegister : authMessages.socialLogin}
                </p>
                <GoogleSignInButton
                  disabled={isSubmitting}
                  label={authMessages.googleSignIn}
                  onClick={handleGoogleSignIn}
                />
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
