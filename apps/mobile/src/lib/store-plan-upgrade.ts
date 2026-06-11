import { canActivateStorePlanWithoutPayment } from './store-plan-activation';
import type { StoreBillingPeriod, StorePlan } from '../services/stores.service';

export function isPaidBillingOption(
  plan: Pick<StorePlan, 'isAdminFree'>,
  billingPeriod: StoreBillingPeriod,
  finalPrice: number
) {
  return !canActivateStorePlanWithoutPayment(plan, billingPeriod, finalPrice);
}

export function planHasPaidUpgradeOption(plan: StorePlan) {
  if (plan.isAdminFree) return false;

  return plan.pricing.some((row) => {
    const finalPrice = Number(row.finalPrice ?? row.price ?? 0);
    return isPaidBillingOption(plan, row.billingPeriod, finalPrice);
  });
}

export function filterPlansForUpgrade(
  plans: StorePlan[],
  currentPlanId: string | undefined,
  currentPlanSortOrder = 0
) {
  return plans.filter((plan) => {
    if (currentPlanId && plan.id === currentPlanId) return false;
    if ((plan.sortOrder ?? 0) <= currentPlanSortOrder) return false;
    return planHasPaidUpgradeOption(plan);
  });
}
