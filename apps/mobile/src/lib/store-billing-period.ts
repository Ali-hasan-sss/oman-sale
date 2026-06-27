import type { StoreBillingPeriod } from '../services/stores.service';

export const STORE_BILLING_PERIOD_DAYS: Record<StoreBillingPeriod, number> = {
  ONE_MONTH: 30,
  TWO_MONTHS: 60,
  THREE_MONTHS: 90
};
