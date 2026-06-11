import { canActivateStorePlanWithoutPayment } from '@/lib/store-plan-activation';
import { type StoreBillingPeriod } from '@/lib/store-billing-period';

export type StorePlanUpgradeCandidate = {
  id: string;
  sortOrder?: number;
  isAdminFree?: boolean;
  pricing: Array<{
    billingPeriod: StoreBillingPeriod;
    price: string | number;
    finalPrice?: number;
  }>;
};

export function isPaidBillingOption(
  plan: Pick<StorePlanUpgradeCandidate, 'isAdminFree'>,
  billingPeriod: StoreBillingPeriod,
  finalPrice: number
) {
  return !canActivateStorePlanWithoutPayment(plan, billingPeriod, finalPrice);
}

export function planHasPaidUpgradeOption(plan: StorePlanUpgradeCandidate) {
  if (plan.isAdminFree) return false;

  return plan.pricing.some((row) => {
    const finalPrice = Number(row.finalPrice ?? row.price ?? 0);
    return isPaidBillingOption(plan, row.billingPeriod, finalPrice);
  });
}

export function filterPlansForUpgrade<T extends StorePlanUpgradeCandidate>(
  plans: T[],
  currentPlanId: string | undefined,
  currentPlanSortOrder = 0
): T[] {
  return plans.filter((plan) => {
    if (currentPlanId && plan.id === currentPlanId) return false;
    if ((plan.sortOrder ?? 0) <= currentPlanSortOrder) return false;
    return planHasPaidUpgradeOption(plan);
  });
}

export function filterPaidBillingPeriods(plan: StorePlanUpgradeCandidate) {
  return plan.pricing.filter((row) => {
    const finalPrice = Number(row.finalPrice ?? row.price ?? 0);
    return isPaidBillingOption(plan, row.billingPeriod, finalPrice);
  });
}
