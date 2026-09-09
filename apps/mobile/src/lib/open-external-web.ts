import { Linking } from 'react-native';

const SITE_ORIGIN = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://omansale.om').replace(/\/$/, '');

export function getWebsiteOrigin() {
  return SITE_ORIGIN;
}

export function buildWebsiteUrl(locale: 'ar' | 'en', pathAndQuery: string) {
  const trimmed = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`;
  const withoutLocale = trimmed.replace(/^\/(ar|en)(?=\/|\?|$)/, '');
  return `${SITE_ORIGIN}/${locale}${withoutLocale}`;
}

export async function openExternalWebPage(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Only http(s) URLs can be opened');
  }

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Cannot open web URL');
  }

  await Linking.openURL(url);
}

export async function openWebsitePage(locale: 'ar' | 'en', pathAndQuery: string) {
  await openExternalWebPage(buildWebsiteUrl(locale, pathAndQuery));
}

/** Hosted Thawani/checkout pages must open in the system browser, never an in-app WebView. */
export async function openWebPaymentPage(paymentUrl: string) {
  await openExternalWebPage(paymentUrl);
}

export function buildBannerAdWebsitePath(input?: { listingId?: string; title?: string; imageUrl?: string | null }) {
  if (!input?.listingId) return '/banner-ad';

  const params = new URLSearchParams();
  params.set('linkUrl', `/listing/${input.listingId}`);
  if (input.imageUrl?.trim()) params.set('imageUrl', input.imageUrl.trim());
  const title = input.title?.trim();
  if (title) {
    params.set('textAr', title);
    params.set('textEn', title);
  }
  return `/banner-ad?${params.toString()}`;
}
