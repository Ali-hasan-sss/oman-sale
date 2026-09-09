import type { Listing, Locale } from './types';

export function formatPrice(price: Listing['price'], currency: string, locale: Locale) {
  if (price === null || price === undefined || price === '') return locale === 'ar' ? 'السعر عند التواصل' : 'Ask for price';
  const numericPrice = Number(price);
  const amount = Number.isFinite(numericPrice) ? numericPrice.toLocaleString('en-US') : String(price);
  return `${amount} ${currency === 'OMR' ? (locale === 'ar' ? 'ر.ع' : 'OMR') : currency}`;
}

export function getCategoryName(listing: Listing, locale: Locale) {
  return (locale === 'ar' ? listing.category?.nameAr : listing.category?.nameEn) ?? listing.category?.name ?? '';
}

export function formatChatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export function formatChatRelativeTime(value: string | undefined | null, locale: Locale) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return locale === 'ar' ? 'الآن' : 'Now';
  if (diff < hour) {
    const mins = Math.floor(diff / minute);
    return locale === 'ar' ? `منذ ${mins} د` : `${mins}m ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return locale === 'ar' ? `منذ ${hours} س` : `${hours}h ago`;
  }
  if (diff < 2 * day) return locale === 'ar' ? 'أمس' : 'Yesterday';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-US', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}

export function formatListingDate(value: string | undefined, locale: Locale) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}
