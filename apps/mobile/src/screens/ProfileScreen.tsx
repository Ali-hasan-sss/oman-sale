import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { ProfileSkeleton } from '../components/skeleton';
import { VerificationCodeInput } from '../components/VerificationCodeInput';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import {
  changePasswordRequest,
  fetchCurrentUser,
  requestEmailChangeRequest,
  updateProfileRequest,
  verifyEmailChangeRequest
} from '../services/user.service';
import { useAuthStore } from '../stores';
import { colors, radius, shadow } from '../theme';
import type { User } from '../types';

type ProfileScreenProps = {
  onLogin: () => void;
};

const HERO_GRADIENT: [string, string] = [colors.brand, '#0b5f42'];

const isSameUser = (a: User | undefined, b: User) =>
  Boolean(
    a &&
      a.id === b.id &&
      a.fullName === b.fullName &&
      a.email === b.email &&
      (a.phone ?? '') === (b.phone ?? '') &&
      (a.bio ?? '') === (b.bio ?? '') &&
      (a.avatar ?? '') === (b.avatar ?? '')
  );

function FieldLabel({ children, isRtl }: { children: string; isRtl: boolean }) {
  return <AppText style={[styles.fieldLabel, isRtl ? styles.rtl : styles.ltr]}>{children}</AppText>;
}

function MessageBanner({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  return (
    <View style={[styles.messageBanner, tone === 'success' ? styles.messageSuccess : styles.messageError]}>
      <AppText style={[styles.messageText, tone === 'success' ? styles.messageTextSuccess : styles.messageTextError]}>
        {message}
      </AppText>
    </View>
  );
}

function SectionCard({ children, icon }: { children: ReactNode; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIconWrap}>
        <Ionicons name={icon} size={22} color={colors.brandDark} />
      </View>
      {children}
    </View>
  );
}

export function ProfileScreen({ onLogin }: ProfileScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const scrollContentStyle = [styles.scrollContent, { paddingBottom: scrollBottomPadding }];
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [pendingEmailChange, setPendingEmailChange] = useState(false);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const inputAlign = isRtl ? styles.inputRtl : styles.inputLtr;

  const applyUser = useCallback((nextUser: User) => {
    setFullName(nextUser.fullName ?? '');
    setEmail(nextUser.email ?? '');
    setPhone(nextUser.phone ?? '');
    setBio(nextUser.bio ?? '');
    setAvatar(nextUser.avatar ?? null);
  }, []);

  const fetchedForUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !accessToken) {
      setIsLoadingProfile(false);
      setHasLoadedProfile(false);
      fetchedForUserIdRef.current = null;
      return;
    }

    if (fetchedForUserIdRef.current === user.id) {
      return;
    }

    let cancelled = false;
    if (!hasLoadedProfile) {
      setIsLoadingProfile(true);
    }

    fetchCurrentUser()
      .then(async (freshUser) => {
        if (cancelled) return;
        applyUser(freshUser);

        const token = useAuthStore.getState().accessToken;
        const refreshToken = useAuthStore.getState().refreshToken;
        const cachedUser = useAuthStore.getState().user;
        if (token && refreshToken && !isSameUser(cachedUser, freshUser)) {
          await setSession({ user: freshUser, tokens: { accessToken: token, refreshToken } });
        }

        fetchedForUserIdRef.current = user.id;
        setHasLoadedProfile(true);
      })
      .catch(() => {
        if (cancelled) return;
        const cachedUser = useAuthStore.getState().user;
        if (cachedUser) applyUser(cachedUser);
        fetchedForUserIdRef.current = user.id;
        setHasLoadedProfile(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, accessToken, applyUser, setSession]);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.common.appName, locale === 'ar' ? 'يرجى السماح بالوصول للصور.' : 'Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.base64) {
      const mime = asset.mimeType ?? 'image/jpeg';
      setAvatar(`data:${mime};base64,${asset.base64}`);
    } else if (asset.uri) {
      setAvatar(asset.uri);
    }
  };

  const saveProfile = async () => {
    setProfileError('');
    setProfileMessage('');
    setIsSavingProfile(true);

    try {
      const updated = await updateProfileRequest({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar
      });
      const token = useAuthStore.getState().accessToken;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (token && refreshToken) {
        await setSession({ user: updated, tokens: { accessToken: token, refreshToken } });
      }
      applyUser(updated);
      setProfileMessage(t.profile.profileSaved);
    } catch {
      setProfileError(t.profile.profileError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async () => {
    setPasswordError('');
    setPasswordMessage('');
    setIsSavingPassword(true);

    try {
      await changePasswordRequest(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage(t.profile.passwordSaved);
    } catch {
      setPasswordError(t.profile.passwordError);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const requestEmailChange = async () => {
    setEmailError('');
    setEmailMessage('');
    setIsSavingEmail(true);

    try {
      await requestEmailChangeRequest(newEmail.trim(), locale);
      setPendingEmailChange(true);
      setEmailVerificationCode('');
      setEmailMessage(t.profile.emailCodeSent);
    } catch {
      setEmailError(t.profile.emailChangeError);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const verifyEmailChange = async () => {
    setEmailError('');
    setEmailMessage('');
    setIsSavingEmail(true);

    try {
      const session = await verifyEmailChangeRequest(newEmail.trim(), emailVerificationCode);
      await setSession(session);
      applyUser(session.user);
      setNewEmail('');
      setEmailVerificationCode('');
      setPendingEmailChange(false);
      setEmailMessage(t.profile.emailChanged);
    } catch {
      setEmailError(t.profile.emailVerifyError);
    } finally {
      setIsSavingEmail(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.guestWrap, { paddingBottom: scrollBottomPadding }]}>
        <LinearGradient colors={HERO_GRADIENT} style={styles.guestHero}>
          <Ionicons name="person-circle-outline" size={72} color="rgba(255,255,255,0.9)" />
          <AppText style={styles.guestHeroTitle}>{t.common.profile}</AppText>
          <AppText style={styles.guestHeroSubtitle}>{t.common.loginRequiredHint}</AppText>
        </LinearGradient>
        <Pressable style={styles.guestButton} onPress={onLogin}>
          <AppText style={styles.guestButtonText}>{t.common.login}</AppText>
        </Pressable>
      </View>
    );
  }

  if (isLoadingProfile && !hasLoadedProfile) {
    return (
      <ScrollView contentContainerStyle={scrollContentStyle} showsVerticalScrollIndicator={false}>
        <ProfileSkeleton />
      </ScrollView>
    );
  }

  const avatarInitial = (fullName || user.fullName || '?').slice(0, 1).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        contentContainerStyle={scrollContentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
          <AppText style={[styles.heroKicker, textAlign]}>Oman Sale</AppText>
          <AppText style={[styles.heroTitle, textAlign]}>{t.profile.title}</AppText>
          <AppText style={[styles.heroSubtitle, textAlign]}>{t.profile.subtitle}</AppText>
        </LinearGradient>

        <View style={styles.card}>
          <AppText style={[styles.cardTitle, textAlign]}>{t.profile.personalInfo}</AppText>

          <View style={[styles.avatarRow, isRtl && styles.avatarRowRtl]}>
            <View style={styles.avatarWrap}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <AppText style={styles.avatarInitial}>{avatarInitial}</AppText>
                </View>
              )}
            </View>

            <View style={styles.avatarActions}>
              <AppText style={[styles.avatarHint, textAlign]}>{t.profile.avatarHint}</AppText>
              <View style={[styles.avatarButtons, isRtl && styles.avatarButtonsRtl]}>
                <Pressable style={styles.secondaryButton} onPress={pickAvatar}>
                  <Ionicons name="camera-outline" size={18} color={colors.brandDark} />
                  <AppText style={styles.secondaryButtonText}>{t.profile.changePhoto}</AppText>
                </Pressable>
                {avatar ? (
                  <Pressable style={styles.ghostButton} onPress={() => setAvatar(null)}>
                    <AppText style={styles.ghostButtonText}>{t.profile.removePhoto}</AppText>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>

          <FieldLabel isRtl={isRtl}>{t.profile.fullName}</FieldLabel>
          <AppTextInput
            value={fullName}
            onChangeText={setFullName}
            style={[styles.input, inputAlign]}
            placeholderTextColor={colors.muted}
          />

          <FieldLabel isRtl={isRtl}>{t.profile.phone}</FieldLabel>
          <AppTextInput
            value={phone}
            onChangeText={setPhone}
            style={[styles.input, styles.ltrField]}
            keyboardType="phone-pad"
            placeholderTextColor={colors.muted}
          />

          <FieldLabel isRtl={isRtl}>{t.profile.email}</FieldLabel>
          <AppTextInput
            value={email}
            editable={false}
            style={[styles.input, styles.inputReadonly, styles.ltrField]}
          />
          <AppText style={[styles.fieldHint, textAlign]}>{t.profile.emailHint}</AppText>

          <FieldLabel isRtl={isRtl}>{t.profile.bio}</FieldLabel>
          <AppTextInput
            value={bio}
            onChangeText={setBio}
            style={[styles.input, styles.textArea, inputAlign]}
            multiline
            maxLength={500}
            placeholder={t.profile.bioPlaceholder}
            placeholderTextColor={colors.muted}
          />

          {profileError ? <MessageBanner tone="error" message={profileError} /> : null}
          {profileMessage ? <MessageBanner tone="success" message={profileMessage} /> : null}

          <Pressable
            style={[styles.primaryButton, isSavingProfile && styles.buttonDisabled]}
            onPress={saveProfile}
            disabled={isSavingProfile || !fullName.trim()}
          >
            {isSavingProfile ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText style={styles.primaryButtonText}>{t.profile.saveProfile}</AppText>
            )}
          </Pressable>
        </View>

        <SectionCard icon="lock-closed-outline">
          <AppText style={[styles.cardTitle, textAlign]}>{t.profile.passwordTitle}</AppText>

          <FieldLabel isRtl={isRtl}>{t.profile.currentPassword}</FieldLabel>
          <AppTextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            style={[styles.input, inputAlign]}
            placeholderTextColor={colors.muted}
          />

          <FieldLabel isRtl={isRtl}>{t.profile.newPassword}</FieldLabel>
          <AppTextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={[styles.input, inputAlign]}
            placeholderTextColor={colors.muted}
          />

          {passwordError ? <MessageBanner tone="error" message={passwordError} /> : null}
          {passwordMessage ? <MessageBanner tone="success" message={passwordMessage} /> : null}

          <Pressable
            style={[styles.darkButton, isSavingPassword && styles.buttonDisabled]}
            onPress={changePassword}
            disabled={isSavingPassword || !currentPassword || newPassword.length < 8}
          >
            {isSavingPassword ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText style={styles.primaryButtonText}>{t.profile.changePassword}</AppText>
            )}
          </Pressable>
        </SectionCard>

        <SectionCard icon="mail-outline">
          <AppText style={[styles.cardTitle, textAlign]}>{t.profile.emailChangeTitle}</AppText>

          <FieldLabel isRtl={isRtl}>{t.profile.newEmail}</FieldLabel>
          <AppTextInput
            value={newEmail}
            onChangeText={(value) => {
              setNewEmail(value);
              setPendingEmailChange(false);
              setEmailVerificationCode('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, styles.ltrField]}
            placeholderTextColor={colors.muted}
          />

          {pendingEmailChange ? (
            <>
              <FieldLabel isRtl={isRtl}>{t.profile.verificationCode}</FieldLabel>
              <VerificationCodeInput
                value={emailVerificationCode}
                onChange={setEmailVerificationCode}
                disabled={isSavingEmail}
                isRtl={isRtl}
              />
            </>
          ) : null}

          {emailError ? <MessageBanner tone="error" message={emailError} /> : null}
          {emailMessage ? <MessageBanner tone="success" message={emailMessage} /> : null}

          {pendingEmailChange ? (
            <Pressable
              style={[styles.primaryButton, (isSavingEmail || emailVerificationCode.length !== 6) && styles.buttonDisabled]}
              onPress={verifyEmailChange}
              disabled={isSavingEmail || emailVerificationCode.length !== 6}
            >
              {isSavingEmail ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText style={styles.primaryButtonText}>{t.profile.verifyEmail}</AppText>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primaryButton, (isSavingEmail || !newEmail.trim()) && styles.buttonDisabled]}
              onPress={requestEmailChange}
              disabled={isSavingEmail || !newEmail.trim()}
            >
              {isSavingEmail ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText style={styles.primaryButtonText}>{t.profile.requestEmailCode}</AppText>
              )}
            </Pressable>
          )}
        </SectionCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    gap: 14
  },
  guestWrap: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 16
  },
  guestHero: {
    borderRadius: radius.lg,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    ...shadow
  },
  guestHeroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900'
  },
  guestHeroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14
  },
  guestButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center'
  },
  guestButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15
  },
  hero: {
    borderRadius: radius.lg,
    padding: 20,
    ...shadow
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 12
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16
  },
  avatarRowRtl: {
    flexDirection: 'row-reverse'
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.brandSoft,
    backgroundColor: colors.background
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.brand
  },
  avatarActions: {
    flex: 1
  },
  avatarHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10
  },
  avatarButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  avatarButtonsRtl: {
    flexDirection: 'row-reverse'
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
    marginTop: 4
  },
  fieldHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    marginBottom: 4
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
    color: colors.ink
  },
  inputReadonly: {
    backgroundColor: '#f1f5f9',
    color: colors.muted
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top'
  },
  ltrField: {
    textAlign: 'left',
    writingDirection: 'ltr'
  },
  primaryButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  darkButton: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  secondaryButtonText: {
    color: colors.brandDark,
    fontWeight: '800',
    fontSize: 13
  },
  ghostButton: {
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  ghostButtonText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15
  },
  buttonDisabled: {
    opacity: 0.7
  },
  messageBanner: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8
  },
  messageSuccess: {
    backgroundColor: colors.brandSoft
  },
  messageError: {
    backgroundColor: '#fef2f2'
  },
  messageText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  messageTextSuccess: {
    color: colors.brandDark
  },
  messageTextError: {
    color: colors.danger
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  },
  inputRtl: {
    textAlign: 'right'
  },
  inputLtr: {
    textAlign: 'left'
  }
});
