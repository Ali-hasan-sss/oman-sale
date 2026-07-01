import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { PhoneVerificationResend, type PhoneVerificationChannel } from '../components/auth/PhoneVerificationResend';
import { ResendCodeButton } from '../components/auth/ResendCodeButton';
import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { ScreenKeyboardAvoiding } from '../components/KeyboardInsets';
import { PhoneInput } from '../components/PhoneInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { VerificationCodeInput } from '../components/VerificationCodeInput';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { isFirebaseConfigured } from '../lib/firebase';
import { isValidPhoneE164 } from '../lib/phone/phone-utils';
import {
  clearRegistrationDraft,
  loadRegistrationDraft,
  saveRegistrationDraft,
  type RegistrationDraftStep
} from '../lib/registration-draft-storage';
import {
  getApiErrorMessage,
  registerCompleteRequest,
  registerResendEmailRequest,
  registerResendPhoneRequest,
  registerSendPhoneCodeRequest,
  registerStartRequest,
  registerVerifyEmailRequest,
  registerVerifyPhoneRequest
} from '../services/auth.service';
import { useAuthStore } from '../stores';
import { colors, radius } from '../theme';

type AuthMode = 'login' | 'register';
type LoginStep = 'form' | 'verify' | 'forgot-request' | 'forgot-reset';
type RegisterStep = 'info' | 'email-code' | 'phone' | 'phone-code' | 'password';

const resolveAuthErrorMessage = (
  errorCode: string | undefined,
  fallback: string,
  errors: Record<string, string>
) => (errorCode && errors[errorCode] ? errors[errorCode] : fallback);

type AuthScreenProps = {
  mode: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
  onSuccess: (options?: { profileCompleted?: boolean }) => void;
};

export function AuthScreen({ mode, onSwitchMode, onSuccess }: AuthScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const scrollContentStyle = [styles.content, { paddingBottom: scrollBottomPadding }];
  const login = useAuthStore((state) => state.login);
  const googleSignIn = useAuthStore((state) => state.googleSignIn);
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendVerification = useAuthStore((state) => state.resendVerification);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const isRegister = mode === 'register';
  const [loginStep, setLoginStep] = useState<LoginStep>('form');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('info');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneVerificationChannel, setPhoneVerificationChannel] = useState<PhoneVerificationChannel>('whatsapp');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [resumedRegistration, setResumedRegistration] = useState(false);

  const submittedEmail = email.trim();
  const submittedPhone = phone.trim();
  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const inputAlign = isRtl ? styles.inputRtl : styles.inputLtr;
  const showGoogleSignIn = isFirebaseConfigured();

  useEffect(() => {
    if (!isRegister) {
      setDraftLoaded(true);
      return;
    }

    let active = true;
    loadRegistrationDraft()
      .then((draft) => {
        if (!active || !draft) return;
        setFullName(draft.fullName);
        setEmail(draft.email);
        setPhone(draft.phone);
        setRegisterStep(draft.step);
        setResumedRegistration(true);
      })
      .finally(() => {
        if (active) setDraftLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [isRegister]);

  useEffect(() => {
    if (!isRegister || !draftLoaded || registerStep === 'info') return;

    void saveRegistrationDraft({
      step: registerStep as RegistrationDraftStep,
      fullName: fullName.trim(),
      email: submittedEmail,
      phone: submittedPhone,
      locale
    });
  }, [draftLoaded, fullName, isRegister, locale, registerStep, submittedEmail, submittedPhone]);

  const resetRegistration = async () => {
    await clearRegistrationDraft();
    setResumedRegistration(false);
    setRegisterStep('info');
    setVerificationCode('');
    setPhoneCode('');
    setError('');
  };

  const finishAuth = (profileCompleted?: boolean) => {
    onSuccess({ profileCompleted });
  };

  const beginVerification = async (targetEmail: string, autoResend = false) => {
    setVerificationCode('');
    setPendingVerificationEmail(targetEmail);
    setLoginStep('verify');
    if (autoResend) {
      const result = await resendVerification(targetEmail, locale);
      if (!result.ok) setError(resolveAuthErrorMessage(result.errorCode, t.auth.verifyError, t.errors));
    }
  };

  const submitLoginForm = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const result = await login(submittedEmail, password);
      if (result.ok) {
        finishAuth(result.profileCompleted);
        return;
      }
      if ('needsVerification' in result && result.needsVerification) {
        await beginVerification(result.email, true);
        return;
      }
      setError(
        resolveAuthErrorMessage('errorCode' in result ? result.errorCode : undefined, t.auth.loginError, t.errors)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await googleSignIn();
      if (result.ok) {
        finishAuth(result.profileCompleted);
        return;
      }
      if ('cancelled' in result && result.cancelled) return;
      if (result.errorCode === 'FIREBASE_NOT_CONFIGURED') {
        setError(t.auth.googleNotConfigured);
        return;
      }
      setError(resolveAuthErrorMessage(result.errorCode, t.auth.googleSignInError, t.errors));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRegistration = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await registerStartRequest({ fullName: fullName.trim(), email: submittedEmail, locale });
      setVerificationCode('');
      setRegisterStep('email-code');
    } catch (startError) {
      setError(getApiErrorMessage(startError, t.auth.registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyRegistrationEmail = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await registerVerifyEmailRequest(submittedEmail, verificationCode);
      setPhoneCode('');
      setRegisterStep('phone');
    } catch {
      setError(t.auth.verifyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendRegistrationPhoneCode = async () => {
    if (!isValidPhoneE164(submittedPhone)) {
      setError(t.auth.phoneInvalid);
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await registerSendPhoneCodeRequest({
        email: submittedEmail,
        phone: submittedPhone,
        locale,
        channel: 'whatsapp'
      });
      setPhoneVerificationChannel('whatsapp');
      setPhoneCode('');
      setRegisterStep('phone-code');
    } catch (sendError) {
      setError(getApiErrorMessage(sendError, t.auth.registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyRegistrationPhone = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await registerVerifyPhoneRequest({ email: submittedEmail, phone: submittedPhone, code: phoneCode });
      setRegisterStep('password');
    } catch {
      setError(t.auth.verifyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeRegistration = async () => {
    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const session = await registerCompleteRequest({
        email: submittedEmail,
        phone: submittedPhone,
        password,
        locale
      });
      await useAuthStore.getState().setSession(session);
      await clearRegistrationDraft();
      finishAuth(true);
    } catch (completeError) {
      setError(getApiErrorMessage(completeError, t.auth.registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitVerification = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await verifyEmail(pendingVerificationEmail, verificationCode);
      if (!result.ok) {
        setError(resolveAuthErrorMessage(result.errorCode, t.auth.verifyError, t.errors));
        return;
      }
      finishAuth(result.profileCompleted);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForgotRequest = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const result = await forgotPassword(submittedEmail, locale);
      if (!result.ok) {
        setError(resolveAuthErrorMessage(result.errorCode, t.auth.resetPasswordError, t.errors));
        return;
      }
      setVerificationCode('');
      setLoginStep('forgot-reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitResetPassword = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const result = await resetPassword(submittedEmail, verificationCode, password);
      if (!result.ok) {
        setError(resolveAuthErrorMessage(result.errorCode, t.auth.resetPasswordError, t.errors));
        return;
      }
      setSuccess(t.auth.resetPasswordSuccess);
      setTimeout(() => {
        setLoginStep('form');
        setPassword('');
        setVerificationCode('');
        onSwitchMode('login');
      }, 900);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGoogleSection = (socialLabel: string) =>
    showGoogleSignIn ? (
      <View style={styles.socialSection}>
        <AppText style={[styles.socialLabel, textAlign]}>{socialLabel}</AppText>
        <GoogleSignInButton
          label={t.auth.googleSignIn}
          onPress={submitGoogleSignIn}
          disabled={isSubmitting}
        />
      </View>
    ) : null;

  if (isRegister) {
    if (!draftLoaded) {
      return (
        <ScreenKeyboardAvoiding>
        <KeyboardAwareScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <AppText style={[styles.subtitle, textAlign]}>{t.common.loading}</AppText>
        </KeyboardAwareScrollView>
      </ScreenKeyboardAvoiding>
      );
    }

    if (registerStep === 'email-code') {
      return (
        <ScreenKeyboardAvoiding>
        <KeyboardAwareScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <AppText style={[styles.title, textAlign]}>{t.auth.verifyTitle}</AppText>
          <AppText style={[styles.subtitle, textAlign]}>
            {resumedRegistration ? `${t.auth.registerResumeHint}\n${t.auth.verifySubtitle}` : t.auth.verifySubtitle}
          </AppText>
          <VerificationCodeInput value={verificationCode} onChange={setVerificationCode} disabled={isSubmitting} isRtl={isRtl} />
          {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
          <PrimaryButton
            label={t.auth.nextButton}
            onPress={verifyRegistrationEmail}
            loading={isSubmitting}
            disabled={verificationCode.length !== 6}
            style={styles.submitSpacing}
          />
          <ResendCodeButton
            disabled={isSubmitting}
            label={t.auth.resendCode}
            countdownLabel={(seconds) => t.auth.resendInSeconds.replace('{seconds}', String(seconds))}
            onResend={async () => {
              await registerResendEmailRequest(submittedEmail, locale);
            }}
          />
          <Pressable onPress={() => void resetRegistration()} disabled={isSubmitting}>
            <AppText style={[styles.switch, textAlign]}>{t.auth.backToLogin}</AppText>
          </Pressable>
        </KeyboardAwareScrollView>
      </ScreenKeyboardAvoiding>
      );
    }

    if (registerStep === 'phone') {
      return (
        <ScreenKeyboardAvoiding>
        <KeyboardAwareScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <AppText style={[styles.title, textAlign]}>{t.auth.phone}</AppText>
          <AppText style={[styles.subtitle, textAlign]}>{t.auth.registerStepPhone}</AppText>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            locale={locale}
            disabled={isSubmitting}
            searchPlaceholder={t.auth.searchCountry}
          />
          {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
          <PrimaryButton label={t.auth.nextButton} onPress={sendRegistrationPhoneCode} loading={isSubmitting} style={styles.submitSpacing} />
          <Pressable onPress={() => setRegisterStep('email-code')} disabled={isSubmitting}>
            <AppText style={[styles.switch, textAlign]}>{t.auth.backToLogin}</AppText>
          </Pressable>
        </KeyboardAwareScrollView>
      </ScreenKeyboardAvoiding>
      );
    }

    if (registerStep === 'phone-code') {
      return (
        <ScreenKeyboardAvoiding>
        <KeyboardAwareScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <AppText style={[styles.title, textAlign]}>{t.auth.phoneVerifyTitle}</AppText>
          <AppText style={[styles.subtitle, textAlign]}>
            {t.auth.phoneCodeSentTo} {submittedPhone}
          </AppText>
          <VerificationCodeInput value={phoneCode} onChange={setPhoneCode} disabled={isSubmitting} isRtl={isRtl} />
          {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
          <PrimaryButton
            label={t.auth.nextButton}
            onPress={verifyRegistrationPhone}
            loading={isSubmitting}
            disabled={phoneCode.length !== 6}
            style={styles.submitSpacing}
          />
          <Pressable
            onPress={() => {
              setPhoneCode('');
              setRegisterStep('phone');
            }}
            disabled={isSubmitting}
          >
            <AppText style={[styles.link, textAlign]}>{t.auth.changePhoneNumber}</AppText>
          </Pressable>
          <PhoneVerificationResend
            disabled={isSubmitting}
            onChannelChange={setPhoneVerificationChannel}
            countdownLabel={(seconds) => t.auth.resendInSeconds.replace('{seconds}', String(seconds))}
            resendViaWhatsappLabel={t.auth.resendViaWhatsapp}
            resendViaSmsLabel={t.auth.resendViaSms}
            onSend={async (channel) => {
              await registerResendPhoneRequest({
                email: submittedEmail,
                phone: submittedPhone,
                locale,
                channel
              });
            }}
          />
        </KeyboardAwareScrollView>
      </ScreenKeyboardAvoiding>
      );
    }

    if (registerStep === 'password') {
      return (
        <ScreenKeyboardAvoiding>
        <KeyboardAwareScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <AppText style={[styles.title, textAlign]}>{t.auth.registerStepPassword}</AppText>
          <AppText style={[styles.subtitle, textAlign]}>{t.auth.password}</AppText>
          <AppTextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t.auth.password}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            autoCapitalize="none"
            style={[styles.input, inputAlign]}
          />
          <AppTextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t.auth.confirmPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            autoCapitalize="none"
            style={[styles.input, inputAlign]}
          />
          {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
          <PrimaryButton label={t.auth.submitRegister} onPress={completeRegistration} loading={isSubmitting} style={styles.submitSpacing} />
        </KeyboardAwareScrollView>
      </ScreenKeyboardAvoiding>
      );
    }

    return (
      <ScreenKeyboardAvoiding>
      <KeyboardAwareScrollView
        contentContainerStyle={scrollContentStyle}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <AppText style={[styles.title, textAlign]}>{t.auth.registerTitle}</AppText>
        <AppText style={[styles.subtitle, textAlign]}>
          {resumedRegistration ? t.auth.registerResumeSubtitle : t.auth.registerSubtitle}
        </AppText>

        <AppTextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder={t.auth.fullNamePlaceholder}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          style={[styles.input, inputAlign]}
        />
        <AppTextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t.auth.email}
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          style={[styles.input, inputAlign]}
        />

        {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
        <PrimaryButton label={t.auth.nextButton} onPress={startRegistration} loading={isSubmitting} style={styles.submitSpacing} />
        {renderGoogleSection(t.auth.socialRegister)}
        <Pressable onPress={() => onSwitchMode('login')}>
          <AppText style={[styles.switch, textAlign]}>{t.auth.switchToLogin}</AppText>
        </Pressable>
      </KeyboardAwareScrollView>
      </ScreenKeyboardAvoiding>
    );
  }

  if (loginStep === 'verify') {
    return (
      <ScreenKeyboardAvoiding>
      <KeyboardAwareScrollView
        contentContainerStyle={scrollContentStyle}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <AppText style={[styles.title, textAlign]}>{t.auth.verifyTitle}</AppText>
        <AppText style={[styles.subtitle, textAlign]}>{t.auth.verifySubtitle}</AppText>
        <VerificationCodeInput value={verificationCode} onChange={setVerificationCode} disabled={isSubmitting} isRtl={isRtl} />
        {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
        <PrimaryButton
          label={t.auth.verifyButton}
          onPress={submitVerification}
          loading={isSubmitting}
          disabled={verificationCode.length !== 6}
          style={styles.submitSpacing}
        />
        <ResendCodeButton
          disabled={isSubmitting}
          label={t.auth.resendCode}
          countdownLabel={(seconds) => t.auth.resendInSeconds.replace('{seconds}', String(seconds))}
          onResend={async () => {
            const result = await resendVerification(pendingVerificationEmail, locale);
            if (!result.ok) setError(resolveAuthErrorMessage(result.errorCode, t.auth.verifyError, t.errors));
          }}
        />
        <Pressable onPress={() => setLoginStep('form')} disabled={isSubmitting}>
          <AppText style={[styles.switch, textAlign]}>{t.auth.backToLogin}</AppText>
        </Pressable>
      </KeyboardAwareScrollView>
      </ScreenKeyboardAvoiding>
    );
  }

  if (loginStep === 'forgot-request' || loginStep === 'forgot-reset') {
    const isResetStep = loginStep === 'forgot-reset';

    return (
      <ScreenKeyboardAvoiding>
      <KeyboardAwareScrollView
        contentContainerStyle={scrollContentStyle}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <AppText style={[styles.title, textAlign]}>
          {isResetStep ? t.auth.resetPasswordTitle : t.auth.forgotPasswordTitle}
        </AppText>
        <AppText style={[styles.subtitle, textAlign]}>
          {isResetStep ? t.auth.resetPasswordSubtitle : t.auth.forgotPasswordSubtitle}
        </AppText>

        {!isResetStep ? (
          <AppTextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t.auth.email}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, inputAlign]}
          />
        ) : (
          <>
            <VerificationCodeInput value={verificationCode} onChange={setVerificationCode} disabled={isSubmitting} isRtl={isRtl} />
            <AppTextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t.auth.newPassword}
              secureTextEntry
              style={[styles.input, inputAlign]}
            />
          </>
        )}

        {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
        {success ? <AppText style={[styles.success, textAlign]}>{success}</AppText> : null}

        <PrimaryButton
          label={isResetStep ? t.auth.resetPasswordButton : t.auth.sendResetCode}
          onPress={isResetStep ? submitResetPassword : submitForgotRequest}
          loading={isSubmitting}
          disabled={isResetStep && verificationCode.length !== 6}
          style={styles.submitSpacing}
        />

        <Pressable onPress={() => setLoginStep('form')} disabled={isSubmitting}>
          <AppText style={[styles.switch, textAlign]}>{t.auth.backToLogin}</AppText>
        </Pressable>
      </KeyboardAwareScrollView>
      </ScreenKeyboardAvoiding>
    );
  }

  return (
    <ScreenKeyboardAvoiding>
    <KeyboardAwareScrollView
      contentContainerStyle={scrollContentStyle}
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    >
      <AppText style={[styles.title, textAlign]}>{t.auth.loginTitle}</AppText>
      <AppText style={[styles.subtitle, textAlign]}>{t.auth.loginSubtitle}</AppText>

      <AppTextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t.auth.email}
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        style={[styles.input, inputAlign]}
      />
      <AppTextInput
        value={password}
        onChangeText={setPassword}
        placeholder={t.auth.password}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        autoCapitalize="none"
        style={[styles.input, inputAlign]}
      />

      <Pressable onPress={() => setLoginStep('forgot-request')} style={styles.forgotRow}>
        <AppText style={[styles.link, textAlign]}>{t.auth.forgotPassword}</AppText>
      </Pressable>

      {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}

      <PrimaryButton label={t.auth.submitLogin} onPress={submitLoginForm} loading={isSubmitting} style={styles.submitSpacing} />
      {renderGoogleSection(t.auth.socialLogin)}
      <Pressable onPress={() => onSwitchMode('register')}>
        <AppText style={[styles.switch, textAlign]}>{t.auth.switchToRegister}</AppText>
      </Pressable>
    </KeyboardAwareScrollView>
    </ScreenKeyboardAvoiding>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    flexGrow: 1
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 8
  },
  subtitle: {
    color: colors.muted,
    marginBottom: 20,
    lineHeight: 22
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 15,
    color: colors.ink
  },
  inputRtl: {
    textAlign: 'right'
  },
  inputLtr: {
    textAlign: 'left'
  },
  forgotRow: {
    marginBottom: 8
  },
  submitSpacing: {
    marginTop: 8
  },
  socialSection: {
    marginTop: 20,
    gap: 12
  },
  socialLabel: {
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '700'
  },
  switch: {
    marginTop: 16,
    color: colors.brand,
    fontWeight: '800'
  },
  link: {
    marginTop: 12,
    color: colors.brand,
    fontWeight: '800'
  },
  error: {
    marginTop: 12,
    marginBottom: 4,
    color: colors.danger,
    fontWeight: '700'
  },
  success: {
    marginTop: 12,
    marginBottom: 4,
    color: colors.brand,
    fontWeight: '700'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
