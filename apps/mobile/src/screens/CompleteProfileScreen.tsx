import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PhoneVerificationResend, type PhoneVerificationChannel } from '../components/auth/PhoneVerificationResend';
import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { PhoneInput } from '../components/PhoneInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { VerificationCodeInput } from '../components/VerificationCodeInput';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { isValidPhoneE164 } from '../lib/phone/phone-utils';
import { useAuthStore } from '../stores';
import { colors, radius } from '../theme';

type CompleteStep = 'details' | 'phone-code' | 'password';

type CompleteProfileScreenProps = {
  onSuccess: () => void;
  onNeedsLogin: () => void;
};

export function CompleteProfileScreen({ onSuccess, onNeedsLogin }: CompleteProfileScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const completeProfileSendPhone = useAuthStore((state) => state.completeProfileSendPhone);
  const completeProfileVerifyPhone = useAuthStore((state) => state.completeProfileVerifyPhone);
  const completeProfile = useAuthStore((state) => state.completeProfile);

  const [step, setStep] = useState<CompleteStep>('details');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneVerificationChannel, setPhoneVerificationChannel] = useState<PhoneVerificationChannel>('whatsapp');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const inputAlign = isRtl ? styles.inputRtl : styles.inputLtr;
  const scrollContentStyle = [styles.content, { paddingBottom: scrollBottomPadding }];

  useEffect(() => {
    if (!accessToken || !user) {
      onNeedsLogin();
      return;
    }
    if (user.profileCompleted !== false) {
      onSuccess();
    }
  }, [accessToken, onNeedsLogin, onSuccess, user]);

  useEffect(() => {
    if (user?.fullName && !fullName) {
      setFullName(user.fullName);
    }
  }, [fullName, user?.fullName]);

  const sendPhoneCode = async () => {
    setError('');
    if (!fullName.trim()) {
      setError(t.auth.fullNamePlaceholder);
      return;
    }
    if (!isValidPhoneE164(phone.trim())) {
      setError(t.auth.phoneInvalid);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await completeProfileSendPhone(phone.trim(), locale, 'whatsapp');
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPhoneVerificationChannel('whatsapp');
      setPhoneCode('');
      setStep('phone-code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyPhoneCode = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await completeProfileVerifyPhone(phone.trim(), phoneCode);
      if (!result.ok) {
        setError(t.auth.verifyError);
        return;
      }
      setStep('password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCompleteProfile = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await completeProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        password
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'phone-code') {
    return (
      <KeyboardAwareScrollView contentContainerStyle={scrollContentStyle}>
        <AppText style={[styles.title, textAlign]}>{t.auth.phoneVerifyTitle}</AppText>
        <AppText style={[styles.subtitle, textAlign]}>
          {t.auth.phoneCodeSentTo} {phone.trim()}
        </AppText>
        <AppText style={[styles.hint, textAlign]}>
          {phoneVerificationChannel === 'whatsapp'
            ? t.auth.phoneCodeChannelHintWhatsapp
            : t.auth.phoneCodeChannelHintSms}
        </AppText>
        <VerificationCodeInput value={phoneCode} onChange={setPhoneCode} disabled={isSubmitting} isRtl={isRtl} />
        {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
        <PrimaryButton
          label={t.auth.nextButton}
          onPress={verifyPhoneCode}
          loading={isSubmitting}
          disabled={phoneCode.length !== 6}
          style={styles.submitSpacing}
        />
        <Pressable
          onPress={() => {
            setError('');
            setPhoneCode('');
            setStep('details');
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
            const result = await completeProfileSendPhone(phone.trim(), locale, channel);
            if (!result.ok) setError(result.error);
          }}
        />
      </KeyboardAwareScrollView>
    );
  }

  if (step === 'password') {
    return (
      <KeyboardAwareScrollView contentContainerStyle={scrollContentStyle}>
        <AppText style={[styles.title, textAlign]}>{t.auth.completeProfileTitle}</AppText>
        <AppText style={[styles.subtitle, textAlign]}>{t.auth.completeProfileStepPassword}</AppText>
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
        <PrimaryButton
          label={t.auth.completeProfileButton}
          onPress={submitCompleteProfile}
          loading={isSubmitting}
          style={styles.submitSpacing}
        />
      </KeyboardAwareScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView contentContainerStyle={scrollContentStyle}>
      <AppText style={[styles.title, textAlign]}>{t.auth.completeProfileTitle}</AppText>
      <AppText style={[styles.subtitle, textAlign]}>{t.auth.completeProfileSubtitle}</AppText>

      <AppText style={[styles.label, textAlign]}>{t.auth.fullName}</AppText>
      <AppTextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder={t.auth.fullNamePlaceholder}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        style={[styles.input, inputAlign]}
      />

      <AppText style={[styles.label, textAlign]}>{t.auth.phone}</AppText>
      <PhoneInput
        value={phone}
        onChange={setPhone}
        locale={locale}
        disabled={isSubmitting}
        searchPlaceholder={t.auth.searchCountry}
      />

      {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
      <PrimaryButton
        label={t.auth.nextButton}
        onPress={sendPhoneCode}
        loading={isSubmitting}
        style={styles.submitSpacing}
      />
    </KeyboardAwareScrollView>
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
  hint: {
    color: colors.muted,
    marginBottom: 16,
    lineHeight: 20
  },
  label: {
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8
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
  submitSpacing: {
    marginTop: 8
  },
  link: {
    marginTop: 16,
    color: colors.brand,
    fontWeight: '800'
  },
  error: {
    marginTop: 12,
    marginBottom: 4,
    color: colors.danger,
    fontWeight: '700'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
