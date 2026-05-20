import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';

import type { Locale } from './types';

const localeKey = 'oman_sale_mobile_locale';

const dictionary = {
  ar: {
    dir: 'rtl',
    common: {
      appName: 'Oman Sale',
      home: 'الرئيسية',
      offers: 'العروض',
      myOffers: 'عروضي',
      chat: 'الدردشة',
      addOffer: 'إضافة عرض',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      profile: 'الملف الشخصي',
      settings: 'الإعدادات',
      favorites: 'المفضلة',
      language: 'English',
      logout: 'تسجيل الخروج',
      guest: 'زائر',
      guestHint: 'تصفح كزائر أو سجل الدخول لمتابعة عروضك',
      viewAll: 'عرض الكل',
      featured: 'مميز',
      search: 'ابحث عن سيارة، عقار، وظيفة...',
      loginRequired: 'سجل الدخول للمتابعة',
      loginRequiredHint: 'يمكنك تصفح التطبيق كزائر، لكن إضافة عرض أو بدء محادثة تحتاج حسابًا.',
      cancel: 'إلغاء',
      save: 'حفظ',
      loading: 'جاري التحميل...',
      retry: 'إعادة المحاولة'
    },
    home: {
      headline: 'بيع واشتري في عُمان بسهولة',
      subtitle: 'عروض موثوقة للسيارات والعقارات والخدمات والوظائف بتجربة سريعة على الجوال.',
      cta: 'تصفح العروض',
      bannersTitle: 'عروض مميزة',
      bannersSubtitle: 'اكتشف عروضاً وإعلانات مختارة بعناية لتناسب اهتماماتك.',
      latest: 'أحدث العروض',
      categories: 'الأقسام',
      categoryNames: ['سيارات', 'عقارات', 'خدمات', 'وظائف']
    },
    auth: {
      welcome: 'مرحبًا بك',
      loginTitle: 'تسجيل الدخول',
      loginSubtitle: 'مرحباً بعودتك إلى Oman Sale',
      registerTitle: 'إنشاء حساب',
      registerSubtitle: 'انضم إلى Oman Sale وابدأ البيع والشراء بسهولة',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      password: 'كلمة المرور',
      newPassword: 'كلمة المرور الجديدة',
      submitLogin: 'تسجيل الدخول',
      submitRegister: 'إنشاء الحساب',
      switchToRegister: 'ليس لديك حساب؟ إنشاء حساب',
      switchToLogin: 'لديك حساب؟ تسجيل الدخول',
      forgotPassword: 'نسيت كلمة المرور؟',
      verifyTitle: 'تأكيد البريد الإلكتروني',
      verifySubtitle: 'أدخل رمز التحقق المكوّن من 6 أرقام الذي أرسلناه إلى بريدك الإلكتروني.',
      verifyButton: 'تأكيد البريد',
      resendCode: 'إعادة إرسال الرمز',
      forgotPasswordTitle: 'نسيت كلمة المرور',
      forgotPasswordSubtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رمز إعادة التعيين.',
      sendResetCode: 'إرسال رمز إعادة التعيين',
      resetPasswordTitle: 'إعادة تعيين كلمة المرور',
      resetPasswordSubtitle: 'أدخل الرمز وكلمة المرور الجديدة.',
      resetPasswordButton: 'تحديث كلمة المرور',
      resetPasswordSuccess: 'تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.',
      backToLogin: 'العودة لتسجيل الدخول',
      loginError: 'تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.',
      registerError: 'تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.',
      verifyError: 'رمز التحقق غير صحيح أو منتهي الصلاحية.',
      resetPasswordError: 'تعذر إعادة تعيين كلمة المرور. تحقق من الرمز وحاول مرة أخرى.',
      error: 'تعذر إتمام العملية. تحقق من البيانات وحاول مرة أخرى.'
    },
    offers: {
      title: 'العروض',
      subtitle: 'اكتشف أحدث الإعلانات والعروض المميزة',
      empty: 'لا توجد عروض متاحة الآن.'
    },
    myOffers: {
      title: 'عروضي',
      subtitle: 'إدارة عروضك المنشورة ومتابعة أدائها',
      empty: 'لم تضف أي عرض بعد.'
    },
    addOffer: {
      title: 'إضافة عرض',
      subtitle: 'أدخل تفاصيل العرض وسيتم نشره بعد المراجعة.',
      titleField: 'عنوان العرض',
      category: 'القسم',
      city: 'المدينة',
      price: 'السعر',
      description: 'الوصف',
      publish: 'نشر العرض',
      success: 'تم تجهيز العرض للإرسال.'
    },
    chat: {
      title: 'الدردشة',
      subtitle: 'محادثاتك مع البائعين والمشترين',
      empty: 'لا توجد محادثات حتى الآن.'
    },
    settings: {
      title: 'الإعدادات',
      subtitle: 'اللغة والتنبيهات وتفضيلات التطبيق',
      notifications: 'التنبيهات',
      privacy: 'الخصوصية والأمان',
      help: 'المساعدة والدعم'
    }
  },
  en: {
    dir: 'ltr',
    common: {
      appName: 'Oman Sale',
      home: 'Home',
      offers: 'Offers',
      myOffers: 'My Offers',
      chat: 'Chat',
      addOffer: 'Add Offer',
      login: 'Log In',
      register: 'Create Account',
      profile: 'Profile',
      settings: 'Settings',
      favorites: 'Favorites',
      language: 'العربية',
      logout: 'Log out',
      guest: 'Guest',
      guestHint: 'Browse as a guest or log in to manage your offers',
      viewAll: 'View all',
      featured: 'Featured',
      search: 'Search cars, property, jobs...',
      loginRequired: 'Log in to continue',
      loginRequiredHint: 'You can browse as a guest, but posting offers or starting chats requires an account.',
      cancel: 'Cancel',
      save: 'Save',
      loading: 'Loading...',
      retry: 'Retry'
    },
    home: {
      headline: 'Buy and sell in Oman with ease',
      subtitle: 'Trusted cars, properties, services, and jobs in a fast mobile experience.',
      cta: 'Browse offers',
      bannersTitle: 'Featured Offers',
      bannersSubtitle: 'Discover highlighted deals and announcements selected for you.',
      latest: 'Latest offers',
      categories: 'Categories',
      categoryNames: ['Cars', 'Property', 'Services', 'Jobs']
    },
    auth: {
      welcome: 'Welcome',
      loginTitle: 'Login',
      loginSubtitle: 'Welcome back to Oman Sale',
      registerTitle: 'Create Account',
      registerSubtitle: 'Join Oman Sale and start buying and selling easily',
      fullName: 'Full name',
      email: 'Email',
      phone: 'Phone',
      password: 'Password',
      newPassword: 'New password',
      submitLogin: 'Log in',
      submitRegister: 'Create account',
      switchToRegister: 'No account? Create one',
      switchToLogin: 'Have an account? Log in',
      forgotPassword: 'Forgot password?',
      verifyTitle: 'Verify your email',
      verifySubtitle: 'Enter the 6-digit verification code we sent to your email.',
      verifyButton: 'Verify email',
      resendCode: 'Resend code',
      forgotPasswordTitle: 'Forgot password',
      forgotPasswordSubtitle: 'Enter your email and we will send a reset code.',
      sendResetCode: 'Send reset code',
      resetPasswordTitle: 'Reset password',
      resetPasswordSubtitle: 'Enter the code and your new password.',
      resetPasswordButton: 'Update password',
      resetPasswordSuccess: 'Password updated. You can sign in now.',
      backToLogin: 'Back to login',
      loginError: 'Could not log in. Check your email and password.',
      registerError: 'Could not create the account. Check your details and try again.',
      verifyError: 'The verification code is invalid or expired.',
      resetPasswordError: 'Could not reset password. Check the code and try again.',
      error: 'Could not complete the request. Check your details and try again.'
    },
    offers: {
      title: 'Offers',
      subtitle: 'Explore the latest and featured listings',
      empty: 'No offers are available right now.'
    },
    myOffers: {
      title: 'My Offers',
      subtitle: 'Manage your published offers and performance',
      empty: 'You have not added any offers yet.'
    },
    addOffer: {
      title: 'Add Offer',
      subtitle: 'Enter the offer details. It will be published after review.',
      titleField: 'Offer title',
      category: 'Category',
      city: 'City',
      price: 'Price',
      description: 'Description',
      publish: 'Publish offer',
      success: 'Offer is ready to submit.'
    },
    chat: {
      title: 'Chat',
      subtitle: 'Your conversations with sellers and buyers',
      empty: 'No conversations yet.'
    },
    settings: {
      title: 'Settings',
      subtitle: 'Language, notifications, and app preferences',
      notifications: 'Notifications',
      privacy: 'Privacy and security',
      help: 'Help and support'
    }
  }
} as const;

type I18nContextValue = {
  locale: Locale;
  /** للمحتوى والنصوص فقط (عربي = يمين). لا تستخدمها في النافبار/التابات/السايدبار. */
  isRtl: boolean;
  t: (typeof dictionary)[Locale];
  toggleLocale: () => void;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<Locale>('ar');

  useEffect(() => {
    AsyncStorage.getItem(localeKey).then((storedLocale) => {
      if (storedLocale === 'ar' || storedLocale === 'en') setLocale(storedLocale);
    });
  }, []);

  const toggleLocale = () => {
    setLocale((current) => {
      const next = current === 'ar' ? 'en' : 'ar';
      AsyncStorage.setItem(localeKey, next).catch(() => undefined);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      locale,
      isRtl: locale === 'ar',
      t: dictionary[locale],
      toggleLocale
    }),
    [locale]
  );

  useEffect(() => {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
  }, []);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
