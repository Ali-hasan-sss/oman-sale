import type { Listing, Locale } from './types';

export const fallbackListings: Listing[] = [
  {
    id: 'demo-1',
    title: 'Toyota Land Cruiser 2022',
    description: 'Excellent condition, full service history, GCC specs.',
    price: 18500,
    currency: 'OMR',
    city: 'مسقط',
    area: 'السيب',
    views: 326,
    createdAt: '2025-02-10T10:00:00.000Z',
    contactPhone: '+96890000001',
    isActive: true,
    isSold: false,
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&h=700&fit=crop' },
      { imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058498cdd8?w=900&h=700&fit=crop' }
    ],
    category: { nameAr: 'سيارات', nameEn: 'Cars' },
    user: {
      id: 'demo-seller-1',
      fullName: 'Ahmed Al Balushi',
      email: 'ahmed@example.com',
      phone: '+96890000001',
      createdAt: '2019-06-01T00:00:00.000Z'
    },
    promotion: { plan: { badgeLabel: 'Featured' } }
  },
  {
    id: 'demo-2',
    title: 'Modern Apartment in Muscat',
    description: 'Two bedrooms close to services with parking.',
    price: 420,
    currency: 'OMR',
    city: 'مسقط',
    area: 'الخوير',
    views: 188,
    createdAt: '2025-01-28T08:00:00.000Z',
    contactPhone: '+96890000002',
    isActive: true,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&h=700&fit=crop' }],
    category: { nameAr: 'عقارات', nameEn: 'Property' },
    user: {
      id: 'demo-seller-2',
      fullName: 'Maha Al Harthy',
      email: 'maha@example.com',
      phone: '+96890000002',
      createdAt: '2021-03-15T00:00:00.000Z'
    }
  },
  {
    id: 'demo-3',
    title: 'Professional Photography Service',
    description: 'Product and real estate photography across Oman.',
    price: 35,
    currency: 'OMR',
    city: 'صلالة',
    views: 91,
    createdAt: '2025-01-05T12:00:00.000Z',
    contactPhone: '+96890000003',
    isActive: true,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&h=700&fit=crop' }],
    category: { nameAr: 'خدمات', nameEn: 'Services' },
    user: {
      id: 'demo-seller-3',
      fullName: 'Salem Al Riyami',
      email: 'salem@example.com',
      phone: '+96890000003',
      createdAt: '2022-11-20T00:00:00.000Z'
    }
  }
];

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
