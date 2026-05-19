'use client';

import { Camera, Globe, Lock, Mail, Phone, Save, Search, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { VerificationCodeInput } from '@/components/auth/verification-code-input';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken, saveUser, saveUserSession, type UserAuthSession, type UserAuthUser } from '@/lib/user-auth';
import { useAuthStore } from '@/store/auth-store';

type ProfileMessages = {
  title: string;
  subtitle: string;
  personalInfo: string;
  avatarHint: string;
  changePhoto: string;
  removePhoto: string;
  fullName: string;
  email: string;
  emailHint: string;
  phone: string;
  bio: string;
  bioPlaceholder: string;
  saveProfile: string;
  saving: string;
  passwordTitle: string;
  currentPassword: string;
  newPassword: string;
  changePassword: string;
  profileSaved: string;
  passwordSaved: string;
  profileError: string;
  passwordError: string;
  emailChangeTitle: string;
  newEmail: string;
  requestEmailCode: string;
  verifyEmail: string;
  verificationCode: string;
  emailCodeSent: string;
  emailChanged: string;
  emailChangeError: string;
  emailVerifyError: string;
};

const messages: Record<'ar' | 'en', ProfileMessages> = {
  ar: {
    title: 'ملفي الشخصي',
    subtitle: 'حدّث بياناتك الشخصية وصورتك وكلمة المرور من مكان واحد.',
    personalInfo: 'البيانات الشخصية',
    avatarHint: 'ارفع صورة واضحة لحسابك أو اترك الأيقونة الافتراضية.',
    changePhoto: 'تغيير الصورة',
    removePhoto: 'إزالة الصورة',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    emailHint: 'لتغيير البريد استخدم نموذج تغيير البريد وأكّد الرمز المرسل إلى البريد الجديد.',
    phone: 'رقم الهاتف',
    bio: 'نبذة عنك',
    bioPlaceholder: 'اكتب نبذة قصيرة تظهر في ملفك الشخصي...',
    saveProfile: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    passwordTitle: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    changePassword: 'تغيير كلمة المرور',
    profileSaved: 'تم تحديث الملف الشخصي بنجاح.',
    passwordSaved: 'تم تغيير كلمة المرور بنجاح.',
    profileError: 'تعذر تحديث الملف الشخصي. تحقق من البيانات وحاول مرة أخرى.',
    passwordError: 'تعذر تغيير كلمة المرور. تأكد من كلمة المرور الحالية.',
    emailChangeTitle: 'تغيير البريد الإلكتروني',
    newEmail: 'البريد الإلكتروني الجديد',
    requestEmailCode: 'إرسال رمز التحقق',
    verifyEmail: 'تأكيد البريد الجديد',
    verificationCode: 'رمز التحقق',
    emailCodeSent: 'تم إرسال رمز التحقق إلى البريد الجديد.',
    emailChanged: 'تم تحديث البريد الإلكتروني بنجاح.',
    emailChangeError: 'تعذر إرسال رمز التحقق. تأكد من البريد وحاول مرة أخرى.',
    emailVerifyError: 'تعذر تأكيد البريد. تحقق من الرمز وحاول مرة أخرى.'
  },
  en: {
    title: 'My Profile',
    subtitle: 'Update your personal details, photo and password from one place.',
    personalInfo: 'Personal information',
    avatarHint: 'Upload a clear profile photo or keep the default user icon.',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    fullName: 'Full name',
    email: 'Email address',
    emailHint: 'To change your email, use the email change form and verify the code sent to the new address.',
    phone: 'Phone number',
    bio: 'Bio',
    bioPlaceholder: 'Write a short bio for your profile...',
    saveProfile: 'Save changes',
    saving: 'Saving...',
    passwordTitle: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    changePassword: 'Change password',
    profileSaved: 'Profile updated successfully.',
    passwordSaved: 'Password changed successfully.',
    profileError: 'Could not update your profile. Check your details and try again.',
    passwordError: 'Could not change password. Check your current password.',
    emailChangeTitle: 'Change email address',
    newEmail: 'New email address',
    requestEmailCode: 'Send verification code',
    verifyEmail: 'Verify new email',
    verificationCode: 'Verification code',
    emailCodeSent: 'We sent a verification code to your new email.',
    emailChanged: 'Email address updated successfully.',
    emailChangeError: 'Could not send the verification code. Check the email and try again.',
    emailVerifyError: 'Could not verify the email. Check the code and try again.'
  }
};

export function ProfilePage() {
  const router = useRouter();
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
  const profileMessages = messages[locale];
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
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
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const inputClass = 'w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-green-500';

  useEffect(() => {
    hydrateFromStorage();
    const token = getUserAccessToken();

    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    api
      .get<{ data: UserAuthUser }>('/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        applyUser(response.data.data);
        saveUser(response.data.data);
        setSession({ accessToken: token, user: response.data.data });
      })
      .catch(() => {
        router.replace(localizedPath('/login'));
      });
  }, []);

  useEffect(() => {
    if (user) applyUser(user);
  }, [user]);

  const applyUser = (nextUser: UserAuthUser) => {
    setFullName(nextUser.fullName ?? '');
    setEmail(nextUser.email ?? '');
    setPhone(nextUser.phone ?? '');
    setBio(nextUser.bio ?? '');
    setAvatar(nextUser.avatar ?? null);
  };

  const getAuthHeaders = () => {
    const token = getUserAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const updateAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setIsSavingProfile(true);

    try {
      const response = await api.patch<{ data: UserAuthUser }>(
        '/users/me',
        { fullName, phone, bio, avatar },
        { headers: getAuthHeaders() }
      );

      saveUser(response.data.data);
      setSession({ accessToken: getUserAccessToken(), user: response.data.data });
      setProfileMessage(profileMessages.profileSaved);
    } catch {
      setProfileError(profileMessages.profileError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    setIsSavingPassword(true);

    try {
      await api.patch(
        '/users/me/password',
        { currentPassword, newPassword },
        { headers: getAuthHeaders() }
      );
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage(profileMessages.passwordSaved);
    } catch {
      setPasswordError(profileMessages.passwordError);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const requestEmailChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError('');
    setEmailMessage('');
    setIsSavingEmail(true);

    try {
      await api.post('/users/me/email-change', { email: newEmail, locale }, { headers: getAuthHeaders() });
      setPendingEmailChange(true);
      setEmailVerificationCode('');
      setEmailMessage(profileMessages.emailCodeSent);
    } catch {
      setEmailError(profileMessages.emailChangeError);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const verifyEmailChange = async () => {
    setEmailError('');
    setEmailMessage('');
    setIsSavingEmail(true);

    try {
      const response = await api.post<{ data: UserAuthSession }>(
        '/users/me/email-change/verify',
        { email: newEmail, code: emailVerificationCode },
        { headers: getAuthHeaders() }
      );
      saveUserSession(response.data.data);
      setSession({ accessToken: response.data.data.tokens.accessToken, user: response.data.data.user });
      applyUser(response.data.data.user);
      setNewEmail('');
      setEmailVerificationCode('');
      setPendingEmailChange(false);
      setEmailMessage(profileMessages.emailChanged);
    } catch {
      setEmailError(profileMessages.emailVerifyError);
    } finally {
      setIsSavingEmail(false);
    }
  };

  return (
    <div id="top" className="min-h-screen bg-gray-50" dir={dir}>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link className="flex items-center gap-3" href={localizedPath('/')}>
              <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
            </Link>

            <MobileNavMenu />
            <div className="hidden items-center gap-4 lg:flex">
              <button
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition hover:bg-gray-50"
                onClick={toggleLocale}
                type="button"
              >
                <Globe size={18} />
                <span className="text-sm">{m.common.languageSwitch}</span>
              </button>
              <ChatNavLink className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
              <HeaderLink href="/all-listings" label={m.common.allListings} />
              <HeaderLink href="/my-listings" label={m.common.myListings} />
              <Link className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700" href={localizedPath('/add-listing')}>
                {m.common.addListing}
              </Link>
              <HeaderAuthAction loginClassName="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
            </div>
          </div>

          <div className="relative">
            <Search
              className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`}
              size={20}
            />
            <input
              type="text"
              placeholder={m.home.searchPlaceholder}
              className={`w-full rounded-lg border border-gray-300 py-3 outline-none focus:ring-2 focus:ring-green-500 ${
                dir === 'rtl' ? 'pl-4 pr-12' : 'pl-12 pr-4'
              }`}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 to-slate-900 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold text-green-100">Oman Sale</p>
              <h1 className="mb-3 text-4xl font-black">{profileMessages.title}</h1>
              <p className="max-w-2xl text-white/80">{profileMessages.subtitle}</p>
            </div>
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-4 ring-white/20">
              {avatar ? <img src={avatar} alt={fullName} className="h-full w-full object-cover" /> : <User size={44} />}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <form onSubmit={saveProfile} className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500 ring-4 ring-green-50">
                {avatar ? <img src={avatar} alt={fullName} className="h-full w-full object-cover" /> : <User size={42} />}
              </div>
              <div className="flex-1">
                <h2 className="mb-2 text-2xl font-black">{profileMessages.personalInfo}</h2>
                <p className="mb-4 text-sm text-slate-500">{profileMessages.avatarHint}</p>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700">
                    <Camera size={16} />
                    {profileMessages.changePhoto}
                    <input type="file" accept="image/*" onChange={updateAvatar} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <X size={16} />
                    {profileMessages.removePhoto}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label={profileMessages.fullName}>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} required className={inputClass} />
              </Field>
              <Field label={profileMessages.phone}>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} className={`${inputClass} pl-10`} dir="ltr" />
                </div>
              </Field>
              <div className="md:col-span-2">
                <Field label={profileMessages.email}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input value={email} readOnly className={`${inputClass} cursor-not-allowed bg-slate-50 pl-10 text-slate-500`} dir="ltr" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{profileMessages.emailHint}</p>
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label={profileMessages.bio}>
                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder={profileMessages.bioPlaceholder}
                    className={`${inputClass} min-h-32 resize-none`}
                    maxLength={500}
                  />
                </Field>
              </div>
            </div>

            {profileError ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{profileError}</p> : null}
            {profileMessage ? <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{profileMessage}</p> : null}

            <button
              type="submit"
              disabled={isSavingProfile}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
            >
              <Save size={18} />
              {isSavingProfile ? profileMessages.saving : profileMessages.saveProfile}
            </button>
          </form>

          <div className="space-y-6">
            <form onSubmit={changePassword} className="h-fit rounded-3xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <Lock size={24} />
              </div>
              <h2 className="mb-6 text-2xl font-black">{profileMessages.passwordTitle}</h2>
              <div className="space-y-5">
                <Field label={profileMessages.currentPassword}>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    className={inputClass}
                  />
                </Field>
                <Field label={profileMessages.newPassword}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                    className={inputClass}
                  />
                </Field>
              </div>

              {passwordError ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{passwordError}</p> : null}
              {passwordMessage ? <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{passwordMessage}</p> : null}

              <button
                type="submit"
                disabled={isSavingPassword}
                className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {isSavingPassword ? profileMessages.saving : profileMessages.changePassword}
              </button>
            </form>

            <form onSubmit={requestEmailChange} className="h-fit rounded-3xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <Mail size={24} />
              </div>
              <h2 className="mb-6 text-2xl font-black">{profileMessages.emailChangeTitle}</h2>
              <div className="space-y-5">
                <Field label={profileMessages.newEmail}>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(event) => {
                      setNewEmail(event.target.value);
                      setPendingEmailChange(false);
                      setEmailVerificationCode('');
                    }}
                    required
                    className={inputClass}
                    dir="ltr"
                  />
                </Field>
                {pendingEmailChange ? (
                  <Field label={profileMessages.verificationCode}>
                    <VerificationCodeInput value={emailVerificationCode} onChange={setEmailVerificationCode} disabled={isSavingEmail} />
                  </Field>
                ) : null}
              </div>

              {emailError ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{emailError}</p> : null}
              {emailMessage ? <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{emailMessage}</p> : null}

              {pendingEmailChange ? (
                <button
                  type="button"
                  onClick={verifyEmailChange}
                  disabled={isSavingEmail || emailVerificationCode.length !== 6}
                  className="mt-6 w-full rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
                >
                  {isSavingEmail ? profileMessages.saving : profileMessages.verifyEmail}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSavingEmail || !newEmail.trim()}
                  className="mt-6 w-full rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
                >
                  {isSavingEmail ? profileMessages.saving : profileMessages.requestEmailCode}
                </button>
              )}
            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );

  function HeaderLink({ href, label }: { href: string; label: string }) {
    return (
      <Link className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" href={localizedPath(href)}>
        {label}
      </Link>
    );
  }
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
