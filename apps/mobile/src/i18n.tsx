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
      confirm: 'تأكيد',
      offlineTitle: 'لا يوجد اتصال بالإنترنت',
      offlineMessage: 'تحقق من الشبكة ثم حاول مرة أخرى.',
      logoutConfirmTitle: 'تسجيل الخروج؟',
      logoutConfirmMessage: 'هل تريد تسجيل الخروج من حسابك؟',
      save: 'حفظ',
      loading: 'جاري التحميل...',
      loadingMore: 'جاري تحميل المزيد...',
      pullToRefresh: 'اسحب للتحديث',
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
    categoryOffers: {
      title: 'عروض القسم',
      available: 'إعلان متاح',
      empty: 'لا توجد إعلانات مطابقة للفلاتر الحالية',
      filters: 'الفلاتر',
      clearAll: 'مسح الكل',
      subcategories: 'الفئة الفرعية',
      all: 'الكل',
      selectCity: 'المدينة',
      priceRange: 'نطاق السعر',
      minPrice: 'أقل سعر',
      maxPrice: 'أعلى سعر',
      applyFilters: 'تطبيق الفلاتر',
      resetFilters: 'إعادة تعيين',
      expand: 'توسيع',
      collapse: 'طي',
      sortBy: 'الترتيب:',
      recent: 'الأحدث',
      priceLow: 'السعر: من الأقل للأعلى',
      priceHigh: 'السعر: من الأعلى للأقل',
      popular: 'الأكثر مشاهدة'
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
      success: 'تم نشر العرض بنجاح وسيظهر بعد المراجعة.',
      successTitle: 'تم النشر بنجاح',
      viewMyOffers: 'عرض عروضي',
      adType: 'نوع الإعلان',
      adTypeSubtitle: 'اختر خطة الترويج ومدة الظهور',
      promotionPlansEmpty: 'لا توجد خطط ترويج متاحة حالياً.',
      promotionLoading: 'جاري تحميل خطط الترويج...',
      promotionHint: 'أكمل الوصف (10 أحرف على الأقل) لعرض خطط الترويج.',
      free: 'مجاني',
      duration: 'مدة الترويج',
      oneWeek: 'أسبوع واحد',
      twoWeeks: 'أسبوعين',
      oneMonth: 'شهر واحد',
      createError: 'تعذر نشر العرض. تحقق من البيانات وحاول مرة أخرى.'
    },
    chat: {
      title: 'الدردشة',
      subtitle: 'محادثاتك مع البائعين والمشترين',
      empty: 'لا توجد محادثات حتى الآن.',
      search: 'ابحث في المحادثات...',
      loading: 'جاري تحميل المحادثات...',
      noMessages: 'لا توجد رسائل بعد',
      newMessage: 'رسالة جديدة',
      online: 'متصل',
      offline: 'غير متصل',
      aboutAd: 'حول الإعلان',
      hideAdCard: 'إخفاء بطاقة الإعلان',
      placeholder: 'اكتب رسالة...',
      threadLoading: 'جاري تحميل المحادثة...',
      threadError: 'تعذر تحميل المحادثة.',
      sendError: 'تعذر إرسال الرسالة.',
      noMessagesYet: 'ابدأ المحادثة برسالة قصيرة.',
      typing: 'يكتب...'
    },
    listingDetail: {
      loading: 'جاري تحميل الإعلان...',
      notFound: 'تعذر تحميل الإعلان.',
      views: 'مشاهدة',
      description: 'الوصف',
      sellerInfo: 'معلومات البائع',
      memberSince: 'عضو منذ',
      showPhone: 'إظهار رقم الهاتف',
      callSeller: 'اتصال',
      startConversation: 'ابدأ المحادثة',
      contactInfo: 'معلومات الاتصال',
      safetyTitle: 'نصيحة أمنية:',
      safetyText: 'تحقق من البائع قبل الشراء. لا تدفع أي مبالغ مقدماً قبل معاينة المنتج.',
      similar: 'إعلانات مشابهة',
      noSimilar: 'لا توجد إعلانات مشابهة حالياً.',
      phoneUnavailable: 'رقم الهاتف غير متاح',
      cannotMessageSelf: 'لا يمكنك إنشاء محادثة مع نفسك.',
      chatError: 'تعذر إنشاء المحادثة. حاول مرة أخرى.',
      soldBadge: 'مباع',
      inactiveNotice: 'هذا الإعلان غير متاح حالياً.',
      report: 'الإبلاغ عن الإعلان',
      share: 'مشاركة',
      back: 'رجوع',
      imageOf: 'صورة'
    },
    profile: {
      title: 'ملفي الشخصي',
      subtitle: 'حدّث بياناتك وصورتك وكلمة المرور من مكان واحد.',
      personalInfo: 'البيانات الشخصية',
      avatarHint: 'ارفع صورة واضحة لحسابك أو اترك الأيقونة الافتراضية.',
      changePhoto: 'تغيير الصورة',
      removePhoto: 'إزالة الصورة',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      emailHint: 'لتغيير البريد استخدم النموذج أدناه وأكّد الرمز المرسل إلى البريد الجديد.',
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
      emailVerifyError: 'تعذر تأكيد البريد. تحقق من الرمز وحاول مرة أخرى.',
      loading: 'جاري تحميل الملف الشخصي...'
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
      confirm: 'Confirm',
      offlineTitle: 'No internet connection',
      offlineMessage: 'Check your network and try again.',
      logoutConfirmTitle: 'Log out?',
      logoutConfirmMessage: 'Do you want to sign out of your account?',
      save: 'Save',
      loading: 'Loading...',
      loadingMore: 'Loading more...',
      pullToRefresh: 'Pull to refresh',
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
    categoryOffers: {
      title: 'Category offers',
      available: 'available listings',
      empty: 'No listings match the current filters',
      filters: 'Filters',
      clearAll: 'Clear all',
      subcategories: 'Subcategory',
      all: 'All',
      selectCity: 'City',
      priceRange: 'Price range',
      minPrice: 'Min price',
      maxPrice: 'Max price',
      applyFilters: 'Apply filters',
      resetFilters: 'Reset',
      expand: 'Expand',
      collapse: 'Collapse',
      sortBy: 'Sort:',
      recent: 'Newest',
      priceLow: 'Price: low to high',
      priceHigh: 'Price: high to low',
      popular: 'Most viewed'
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
      success: 'Your listing was published and will appear after review.',
      successTitle: 'Published successfully',
      viewMyOffers: 'View my offers',
      adType: 'Ad type',
      adTypeSubtitle: 'Choose a promotion plan and duration',
      promotionPlansEmpty: 'No promotion plans are available right now.',
      promotionLoading: 'Loading promotion plans...',
      promotionHint: 'Complete the description (at least 10 characters) to see promotion plans.',
      free: 'Free',
      duration: 'Promotion duration',
      oneWeek: 'One week',
      twoWeeks: 'Two weeks',
      oneMonth: 'One month',
      createError: 'Could not publish the listing. Check your details and try again.'
    },
    chat: {
      title: 'Chat',
      subtitle: 'Your conversations with sellers and buyers',
      empty: 'No conversations yet.',
      search: 'Search conversations...',
      loading: 'Loading conversations...',
      noMessages: 'No messages yet',
      newMessage: 'New message',
      online: 'Online',
      offline: 'Offline',
      aboutAd: 'About listing',
      hideAdCard: 'Hide listing card',
      placeholder: 'Write a message...',
      threadLoading: 'Loading conversation...',
      threadError: 'Could not load conversation.',
      sendError: 'Could not send message.',
      noMessagesYet: 'Start the conversation with a short message.',
      typing: 'typing...'
    },
    listingDetail: {
      loading: 'Loading listing...',
      notFound: 'Could not load listing.',
      views: 'views',
      description: 'Description',
      sellerInfo: 'Seller information',
      memberSince: 'Member since',
      showPhone: 'Show phone number',
      callSeller: 'Call',
      startConversation: 'Start conversation',
      contactInfo: 'Contact information',
      safetyTitle: 'Safety tip:',
      safetyText: 'Verify the seller before buying. Do not pay in advance before inspecting the item.',
      similar: 'Similar listings',
      noSimilar: 'No similar listings right now.',
      phoneUnavailable: 'Phone number unavailable',
      cannotMessageSelf: 'You cannot message yourself.',
      chatError: 'Could not start the conversation. Try again.',
      soldBadge: 'Sold',
      inactiveNotice: 'This listing is not available right now.',
      report: 'Report listing',
      share: 'Share',
      back: 'Back',
      imageOf: 'Image'
    },
    profile: {
      title: 'My Profile',
      subtitle: 'Update your details, photo, and password in one place.',
      personalInfo: 'Personal information',
      avatarHint: 'Upload a clear profile photo or keep the default icon.',
      changePhoto: 'Change photo',
      removePhoto: 'Remove photo',
      fullName: 'Full name',
      email: 'Email address',
      emailHint: 'To change your email, use the form below and verify the code sent to the new address.',
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
      emailVerifyError: 'Could not verify the email. Check the code and try again.',
      loading: 'Loading profile...'
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
