import { StoreBillingPeriod } from '@prisma/client';

export const STORE_BILLING_PERIOD_DAYS: Record<StoreBillingPeriod, number> = {
  [StoreBillingPeriod.ONE_MONTH]: 30,
  [StoreBillingPeriod.TWO_MONTHS]: 60,
  [StoreBillingPeriod.THREE_MONTHS]: 90
};

export const STORE_BILLING_PERIODS = [
  StoreBillingPeriod.ONE_MONTH,
  StoreBillingPeriod.TWO_MONTHS,
  StoreBillingPeriod.THREE_MONTHS
] as const;

export function getBillingPeriodDays(period: StoreBillingPeriod) {
  return STORE_BILLING_PERIOD_DAYS[period];
}

export function getSubscriptionEndDate(billingPeriod: StoreBillingPeriod, startsAt = new Date()) {
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + getBillingPeriodDays(billingPeriod));
  return endsAt;
}
