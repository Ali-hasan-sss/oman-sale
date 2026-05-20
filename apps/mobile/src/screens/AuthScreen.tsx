import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { VerificationCodeInput } from '../components/VerificationCodeInput';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { useAuthStore } from '../stores';
import { colors, radius } from '../theme';

type AuthMode = 'login' | 'register';
type AuthStep = 'form' | 'verify' | 'forgot-request' | 'forgot-reset';

type AuthScreenProps = {
  mode: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
  onSuccess: () => void;
};

export function AuthScreen({ mode, onSwitchMode, onSuccess }: AuthScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const scrollContentStyle = [styles.content, { paddingBottom: scrollBottomPadding }];
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendVerification = useAuthStore((state) => state.resendVerification);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const isRegister = mode === 'register';
  const [step, setStep] = useState<AuthStep>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const inputAlign = isRtl ? styles.inputRtl : styles.inputLtr;

  const beginVerification = async (targetEmail: string, autoResend = false) => {
    setVerificationCode('');
    setPendingVerificationEmail(targetEmail);
    setStep('verify');
    if (autoResend) {
      const result = await resendVerification(targetEmail, locale);
      if (!result.ok) setError(t.auth.verifyError);
    }
  };

  const submitForm = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const submittedEmail = email.trim();

      if (isRegister) {
        const result = await register({
          fullName,
          email: submittedEmail,
          phone,
          password,
          locale
        });
        if (!result.ok) {
          setError(t.auth.registerError);
          return;
        }
        await beginVerification(result.email);
        return;
      }

      const result = await login(submittedEmail, password);
      if (result.ok) {
        onSuccess();
        return;
      }
      if ('needsVerification' in result && result.needsVerification) {
        await beginVerification(result.email, true);
        return;
      }
      setError(t.auth.loginError);
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
        setError(t.auth.verifyError);
        return;
      }
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitResend = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await resendVerification(pendingVerificationEmail, locale);
      if (!result.ok) setError(t.auth.verifyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForgotRequest = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const result = await forgotPassword(email.trim(), locale);
      if (!result.ok) {
        setError(t.auth.resetPasswordError);
        return;
      }
      setVerificationCode('');
      setStep('forgot-reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitResetPassword = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const result = await resetPassword(email.trim(), verificationCode, password);
      if (!result.ok) {
        setError(t.auth.resetPasswordError);
        return;
      }
      setSuccess(t.auth.resetPasswordSuccess);
      setTimeout(() => {
        setStep('form');
        setPassword('');
        setVerificationCode('');
        onSwitchMode('login');
      }, 900);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'verify') {
    return (
      <ScrollView contentContainerStyle={scrollContentStyle}>
        <AppText style={[styles.title, textAlign]}>{t.auth.verifyTitle}</AppText>
        <AppText style={[styles.subtitle, textAlign]}>{t.auth.verifySubtitle}</AppText>
        <VerificationCodeInput value={verificationCode} onChange={setVerificationCode} disabled={isSubmitting} isRtl={isRtl} />
        {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
        <Pressable
          style={[styles.submit, (isSubmitting || verificationCode.length !== 6) && styles.submitDisabled]}
          onPress={submitVerification}
          disabled={isSubmitting || verificationCode.length !== 6}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <AppText style={styles.submitText}>{t.auth.verifyButton}</AppText>
          )}
        </Pressable>
        <Pressable onPress={submitResend} disabled={isSubmitting}>
          <AppText style={[styles.link, textAlign]}>{t.auth.resendCode}</AppText>
        </Pressable>
        <Pressable onPress={() => setStep('form')} disabled={isSubmitting}>
          <AppText style={[styles.switch, textAlign]}>{t.auth.backToLogin}</AppText>
        </Pressable>
      </ScrollView>
    );
  }

  if (step === 'forgot-request' || step === 'forgot-reset') {
    const isResetStep = step === 'forgot-reset';

    return (
      <ScrollView contentContainerStyle={scrollContentStyle}>
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

        <Pressable
          style={[styles.submit, (isSubmitting || (isResetStep && verificationCode.length !== 6)) && styles.submitDisabled]}
          onPress={isResetStep ? submitResetPassword : submitForgotRequest}
          disabled={isSubmitting || (isResetStep && verificationCode.length !== 6)}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <AppText style={styles.submitText}>
              {isResetStep ? t.auth.resetPasswordButton : t.auth.sendResetCode}
            </AppText>
          )}
        </Pressable>

        <Pressable onPress={() => setStep('form')} disabled={isSubmitting}>
          <AppText style={[styles.switch, textAlign]}>{t.auth.backToLogin}</AppText>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={scrollContentStyle}>
      <AppText style={[styles.title, textAlign]}>{isRegister ? t.auth.registerTitle : t.auth.loginTitle}</AppText>
      <AppText style={[styles.subtitle, textAlign]}>
        {isRegister ? t.auth.registerSubtitle : t.auth.loginSubtitle}
      </AppText>

      {isRegister ? (
        <AppTextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder={t.auth.fullName}
          style={[styles.input, inputAlign]}
        />
      ) : null}

      <AppTextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t.auth.email}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, inputAlign]}
      />

      {isRegister ? (
        <AppTextInput
          value={phone}
          onChangeText={setPhone}
          placeholder={t.auth.phone}
          keyboardType="phone-pad"
          style={[styles.input, inputAlign]}
        />
      ) : null}

      <AppTextInput
        value={password}
        onChangeText={setPassword}
        placeholder={t.auth.password}
        secureTextEntry
        style={[styles.input, inputAlign]}
      />

      {!isRegister ? (
        <Pressable onPress={() => setStep('forgot-request')} style={styles.forgotRow}>
          <AppText style={[styles.link, textAlign]}>{t.auth.forgotPassword}</AppText>
        </Pressable>
      ) : null}

      {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}

      <Pressable style={[styles.submit, isSubmitting && styles.submitDisabled]} onPress={submitForm} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <AppText style={styles.submitText}>{isRegister ? t.auth.submitRegister : t.auth.submitLogin}</AppText>
        )}
      </Pressable>

      <Pressable onPress={() => onSwitchMode(isRegister ? 'login' : 'register')}>
        <AppText style={[styles.switch, textAlign]}>
          {isRegister ? t.auth.switchToLogin : t.auth.switchToRegister}
        </AppText>
      </Pressable>
    </ScrollView>
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
    marginBottom: 12
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
  submit: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8
  },
  submitDisabled: {
    opacity: 0.7
  },
  submitText: {
    color: '#fff',
    fontWeight: '900'
  },
  switch: {
    marginTop: 16,
    color: colors.brand,
    fontWeight: '800'
  },
  link: {
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
