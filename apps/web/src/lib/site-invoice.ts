import { siteContactEmail } from '@/lib/site-contact';

export const siteInvoiceConfig = {
  brandNameAr: 'عمان سيل',
  brandNameEn: 'Oman Sale',
  logoUrl: '/logo.png',
  email: siteContactEmail,
  website: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://omansale.om',
  taxNumber: process.env.NEXT_PUBLIC_PLATFORM_TAX_NUMBER ?? 'OM-VAT-000000000',
  commercialRegistration: process.env.NEXT_PUBLIC_PLATFORM_COMMERCIAL_REGISTRATION ?? 'CR-0000000'
} as const;
