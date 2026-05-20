import type { Conversation, Listing, Locale } from './types';

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
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&h=700&fit=crop' }],
    category: { nameAr: 'سيارات', nameEn: 'Cars' },
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
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&h=700&fit=crop' }],
    category: { nameAr: 'عقارات', nameEn: 'Property' }
  },
  {
    id: 'demo-3',
    title: 'Professional Photography Service',
    description: 'Product and real estate photography across Oman.',
    price: 35,
    currency: 'OMR',
    city: 'صلالة',
    views: 91,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&h=700&fit=crop' }],
    category: { nameAr: 'خدمات', nameEn: 'Services' }
  }
];

export const fallbackConversations: Conversation[] = [
  {
    id: 'conv-1',
    adTitle: 'Toyota Land Cruiser 2022',
    sellerName: 'Ahmed Al Balushi',
    lastMessage: 'هل السيارة ما زالت متوفرة؟',
    updatedAt: '10:25',
    unread: true
  },
  {
    id: 'conv-2',
    adTitle: 'Modern Apartment in Muscat',
    sellerName: 'Maha Al Harthy',
    lastMessage: 'يمكنك المعاينة مساء اليوم.',
    updatedAt: 'أمس'
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
