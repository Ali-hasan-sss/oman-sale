'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { RegisterStepper } from '@/components/auth/register-stepper';
import { ResendCodeButton } from '@/components/auth/resend-code-button';
import { VerificationCodeInput } from '@/components/auth/verification-code-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { SiteFooter } from '@/components/home/site-footer';
import { UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { resolveApiErrorMessage } from '@/lib/api-errors';
import { getAuthMessages, useI18n } from '@/lib/i18n';
import { isValidPhoneE164 } from '@/lib/phone/phone-utils';
import { getStoredUser, getUserAccessToken, saveUser, type UserAuthUser } from '@/lib/user-auth';
import { useAuthStore } from '@/store/auth-store';

type CompleteStep = 'details' | 'phone-code' | 'password';

export function CompleteProfilePage() {
  const router = useRouter();
  const { dir, locale, localizedPath, m } = useI18n();
  const authMessages = getAuthMessages(locale);
  const setSession = useAuthStore((state) => state.setSession);
  const authUser = useAuthStore((state) => state.user);

  const [step, setStep] = useState<CompleteStep>('details');
  const [fullName, setFullName] = useState(() => getStoredUser()?.fullName ?? '');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500';
  const stepIndex = step === 'details' ? 0 : step === 'phone-code' ? 1 : 2;
  const steps = [
    { label: authMessages.completeProfileStepDetails },
    { label: authMessages.completeProfileStepPhone },
    { label: authMessages.completeProfileStepPassword }
  ];

  useEffect(() => {
    const token = getUserAccessToken();
    const user = authUser ?? getStoredUser();

    if (!token || !user) {
      router.replace(localizedPath('/login'));
      return;
    }

    if (user.profileCompleted === true) {
      router.replace(localizedPath('/'));
      return;
    }

    if (!fullName && user.fullName) {
      setFullName(user.fullName);
    }

    setAuthChecked(true);
  }, [authUser, fullName, localizedPath, router]);

  const sendPhoneCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError(authMessages.fullNamePlaceholder);
      return;
    }
    if (!isValidPhoneE164(phone)) {
      setError(authMessages.phoneInvalid);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/complete-profile/send-phone', { phone: phone.trim(), locale });
      setPhoneCode('');
      setStep('phone-code');
    } catch (sendError) {
      setError(resolveApiErrorMessage(sendError, m.errors, authMessages.completeProfileError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyPhoneCode = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/complete-profile/verify-phone', { phone: phone.trim(), code: phoneCode });
      setStep('password');
    } catch {
      setError(authMessages.verifyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(authMessages.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post<{ data: { user: UserAuthUser } }>('/auth/complete-profile', {
        fullName: fullName.trim(),
        phone: phone.trim(),
        password
      });
      const user = response.data.data.user;
      saveUser(user);
      setSession({ accessToken: getUserAccessToken(), user });
      router.push(localizedPath('/'));
    } catch (completeError) {
      setError(resolveApiErrorMessage(completeError, m.errors, authMessages.completeProfileError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="site-page-shell bg-gray-50" dir={dir}>
        <UserSiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm font-bold text-gray-500">{authMessages.submitting}</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">{authMessages.completeProfileTitle}</h1>
            <p className="text-gray-600">{authMessages.completeProfileSubtitle}</p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <RegisterStepper
              activeStepIndex={stepIndex}
              steps={steps}
              ariaLabel={authMessages.completeProfileStepsAriaLabel}
            />

            {step === 'details' ? (
              <form onSubmit={sendPhoneCode}>
                <div className="mb-4">
                  <label className="mb-2 block">{authMessages.fullName}</label>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    className={inputClass}
                  />
                </div>
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
            ) : null}

            {step === 'phone-code' ? (
              <div>
                <h2 className="mb-2 text-center text-2xl font-black">{authMessages.phoneVerifyTitle}</h2>
                <p className="mb-6 text-center text-sm text-gray-600">{authMessages.phoneVerifySubtitle}</p>
                <VerificationCodeInput value={phoneCode} onChange={setPhoneCode} disabled={isSubmitting} />
                {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
                <button
                  type="button"
                  onClick={verifyPhoneCode}
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
                      await api.post('/auth/complete-profile/send-phone', { phone: phone.trim(), locale });
                    }}
                  />
                </div>
              </div>
            ) : null}

            {step === 'password' ? (
              <form onSubmit={completeProfile}>
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
                  {isSubmitting ? authMessages.submitting : authMessages.completeProfileButton}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
