import type { AssistantLocale } from './assistant.validation';
import type { AssistantAction } from './assistant.types';

export type AssistantAuthContext = {
  locale: AssistantLocale;
  isAuthenticated: boolean;
};

const labels = {
  ar: {
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    createStore: 'إنشاء متجر',
    addListing: 'أضف إعلان',
    myListings: 'إعلاناتي',
    browseStores: 'استعرض المتاجر',
    allListings: 'جميع الإعلانات',
    bannerAd: 'طلب بنر إعلاني',
    favorites: 'المفضلة',
    chats: 'دردشاتي'
  },
  en: {
    login: 'Log in',
    register: 'Create account',
    createStore: 'Create store',
    addListing: 'Post a listing',
    myListings: 'My listings',
    browseStores: 'Browse stores',
    allListings: 'All listings',
    bannerAd: 'Request banner ad',
    favorites: 'Favorites',
    chats: 'My chats'
  }
} as const;

function path(locale: AssistantLocale, href: string) {
  return `/${locale}${href}`;
}

export function buildLoginRegisterActions(ctx: AssistantAuthContext, primary: 'login' | 'register' = 'login'): AssistantAction[] {
  const t = labels[ctx.locale];
  if (ctx.isAuthenticated) return [];

  if (primary === 'register') {
    return [
      { label: t.register, href: path(ctx.locale, '/register'), variant: 'primary' },
      { label: t.login, href: path(ctx.locale, '/login'), variant: 'default' }
    ];
  }

  return [
    { label: t.login, href: path(ctx.locale, '/login'), variant: 'primary' },
    { label: t.register, href: path(ctx.locale, '/register'), variant: 'default' }
  ];
}

export function buildCreateStoreActions(ctx: AssistantAuthContext): AssistantAction[] {
  const t = labels[ctx.locale];
  if (ctx.isAuthenticated) {
    return [{ label: t.createStore, href: path(ctx.locale, '/stores/create'), variant: 'primary' }];
  }
  return buildLoginRegisterActions(ctx, 'register');
}

export function buildPostAdActions(ctx: AssistantAuthContext): AssistantAction[] {
  const t = labels[ctx.locale];
  if (ctx.isAuthenticated) {
    return [{ label: t.addListing, href: path(ctx.locale, '/add-listing'), variant: 'primary' }];
  }
  return buildLoginRegisterActions(ctx, 'register');
}

export function buildPromoteListingActions(ctx: AssistantAuthContext): AssistantAction[] {
  const t = labels[ctx.locale];
  if (ctx.isAuthenticated) {
    return [
      { label: t.myListings, href: path(ctx.locale, '/my-listings'), variant: 'primary' },
      { label: t.addListing, href: path(ctx.locale, '/add-listing'), variant: 'default' }
    ];
  }
  return buildLoginRegisterActions(ctx, 'login');
}

export function buildPricingActions(ctx: AssistantAuthContext): AssistantAction[] {
  const t = labels[ctx.locale];
  const actions: AssistantAction[] = [];

  if (ctx.isAuthenticated) {
    actions.push(
      { label: t.createStore, href: path(ctx.locale, '/stores/create'), variant: 'primary' },
      { label: t.myListings, href: path(ctx.locale, '/my-listings'), variant: 'default' }
    );
  } else {
    actions.push(...buildLoginRegisterActions(ctx, 'register'));
  }

  actions.push({ label: t.allListings, href: path(ctx.locale, '/all-listings'), variant: 'default' });
  return actions;
}

export function buildContactActions(ctx: AssistantAuthContext): AssistantAction[] {
  return [
    { label: 'info@omansale.om', href: 'mailto:info@omansale.om', variant: 'primary' },
    { label: ctx.locale === 'ar' ? 'اتصل بنا' : 'Call us', href: 'tel:+96824567890', variant: 'default' }
  ];
}

export function buildPlatformOverviewActions(ctx: AssistantAuthContext): AssistantAction[] {
  const t = labels[ctx.locale];
  const actions: AssistantAction[] = [
    { label: t.browseStores, href: path(ctx.locale, '/stores'), variant: 'default' },
    { label: t.allListings, href: path(ctx.locale, '/all-listings'), variant: 'default' }
  ];

  if (ctx.isAuthenticated) {
    actions.unshift({ label: t.createStore, href: path(ctx.locale, '/stores/create'), variant: 'primary' });
  } else {
    actions.unshift(...buildLoginRegisterActions(ctx, 'register'));
  }

  return actions;
}

export function buildBannerAdActions(ctx: AssistantAuthContext): AssistantAction[] {
  const t = labels[ctx.locale];
  if (ctx.isAuthenticated) {
    return [{ label: t.bannerAd, href: path(ctx.locale, '/banner-ad'), variant: 'primary' }];
  }
  return buildLoginRegisterActions(ctx, 'login');
}

export function buildChatActions(ctx: AssistantAuthContext): AssistantAction[] {
  const t = labels[ctx.locale];
  if (ctx.isAuthenticated) {
    return [{ label: t.chats, href: path(ctx.locale, '/chats'), variant: 'primary' }];
  }
  return buildLoginRegisterActions(ctx, 'login');
}

export function buildFavoritesActions(ctx: AssistantAuthContext): AssistantAction[] {
  const t = labels[ctx.locale];
  if (ctx.isAuthenticated) {
    return [{ label: t.favorites, href: path(ctx.locale, '/favorites'), variant: 'primary' }];
  }
  return buildLoginRegisterActions(ctx, 'login');
}
