import { type StoreBillingPeriod } from '@/lib/store-billing-period';

export function canActivateStorePlanWithoutPayment(
  plan: { isAdminFree?: boolean },
  billingPeriod: StoreBillingPeriod,
  finalPrice: number
) {
  if (finalPrice <= 0) return true;
  return Boolean(plan.isAdminFree) && billingPeriod === 'ONE_MONTH';
}
