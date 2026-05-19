'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo } from 'react';

import ar from './locales/ar.json';
import en from './locales/en.json';

export type Locale = 'ar' | 'en';

const locales: Locale[] = ['ar', 'en'];
const defaultLocale: Locale = 'ar';
const localeStorageKey = 'oman_sale_locale';

export const messages = {
  ar,
  en
} as const;

type AuthMessages = {
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  fullName: string;
  fullNamePlaceholder: string;
  email: string;
  phone: string;
  password: string;
  rememberMe: string;
  forgotPassword: string;
  loginButton: string;
  registerButton: string;
  submitting: string;
  noAccount: string;
  hasAccount: string;
  registerNow: string;
  loginNow: string;
  socialLogin: string;
  loginError: string;
  registerError: string;
  verifyTitle: string;
  verifySubtitle: string;
  verifyButton: string;
  resendCode: string;
  verifyError: string;
  forgotPasswordTitle: string;
  forgotPasswordSubtitle: string;
  sendResetCode: string;
  resetPasswordTitle: string;
  resetPasswordSubtitle: string;
  newPassword: string;
  resetPasswordButton: string;
  resetPasswordSuccess: string;
  resetPasswordError: string;
};

type CommonMessages = (typeof ar)['common'] & {
  profile: string;
  favorites: string;
  logout: string;
  online: string;
  offline: string;
};

type Messages = (typeof messages)[Locale] & {
  auth: AuthMessages;
  common: CommonMessages;
};

type I18nContextValue = {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  m: Messages;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  localizedPath: (href: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const isLocale = (value: unknown): value is Locale => value === 'ar' || value === 'en';

const getLocaleFromPath = (pathname: string): Locale => {
  const segment = pathname.split('/').filter(Boolean)[0];
  return isLocale(segment) ? segment : defaultLocale;
};

const stripLocale = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean);
  if (isLocale(parts[0])) parts.shift();
  return `/${parts.join('/')}`.replace(/\/$/, '') || '/';
};

export function I18nProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPath(pathname);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const localizedPath = (href: string) => {
    if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return href;
    const cleanHref = stripLocale(href.startsWith('/') ? href : `/${href}`);
    return `/${locale}${cleanHref === '/' ? '' : cleanHref}`;
  };

  const setLocale = (nextLocale: Locale) => {
    window.localStorage.setItem(localeStorageKey, nextLocale);
    const cleanPath = stripLocale(pathname);
    router.push(`/${nextLocale}${cleanPath === '/' ? '' : cleanPath}`);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    window.localStorage.setItem(localeStorageKey, locale);
  }, [dir, locale]);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(localeStorageKey);
    if (!isLocale(pathname.split('/').filter(Boolean)[0]) && isLocale(storedLocale)) {
      router.replace(`/${storedLocale}${pathname === '/' ? '' : pathname}`);
    }
  }, [pathname, router]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir,
      m: messages[locale] as Messages,
      setLocale,
      toggleLocale: () => setLocale(locale === 'ar' ? 'en' : 'ar'),
      localizedPath
    }),
    [dir, locale, pathname]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}

export const getAuthMessages = (locale: Locale) => (messages[locale] as Messages).auth;

export const supportedLocales = locales;
export { defaultLocale };
