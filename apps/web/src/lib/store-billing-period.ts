export const STORE_BILLING_PERIODS = ['ONE_MONTH', 'TWO_MONTHS', 'THREE_MONTHS'] as const;

export type StoreBillingPeriod = (typeof STORE_BILLING_PERIODS)[number];

export const STORE_BILLING_PERIOD_DAYS: Record<StoreBillingPeriod, number> = {
  ONE_MONTH: 30,
  TWO_MONTHS: 60,
  THREE_MONTHS: 90
};

export function getBillingPeriodLabel(period: StoreBillingPeriod, locale: 'ar' | 'en') {
  if (period === 'THREE_MONTHS') return locale === 'ar' ? '3 أشهر' : '3 months';
  if (period === 'TWO_MONTHS') return locale === 'ar' ? 'شهرين' : '2 months';
  return locale === 'ar' ? 'شهر واحد' : '1 month';
}
