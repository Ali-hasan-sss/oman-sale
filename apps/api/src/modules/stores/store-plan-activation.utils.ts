import { StoreBillingPeriod, StoreSubscriptionStatus } from '@prisma/client';

import { ErrorCodes } from '../../shared/constants/error-codes';
import { ApiError } from '../../shared/utils/api-error';

type StorePlanActivationInfo = {
  id?: string;
  isAdminFree: boolean;
  sortOrder?: number;
};

export function canActivateStorePlanWithoutPayment(
  plan: StorePlanActivationInfo,
  billingPeriod: StoreBillingPeriod,
  finalPrice: number
) {
  if (finalPrice <= 0) return true;
  return plan.isAdminFree && billingPeriod === StoreBillingPeriod.ONE_MONTH;
}

export function assertAdminFreeBillingPeriod(plan: StorePlanActivationInfo, billingPeriod: StoreBillingPeriod) {
  if (plan.isAdminFree && billingPeriod !== StoreBillingPeriod.ONE_MONTH) {
    throw new ApiError(
      400,
      'Admin free plans only support one-month activation',
      ErrorCodes.VALIDATION_FAILED
    );
  }
}

type ActiveStoreSubscriptionInfo = {
  planId: string;
  isActive: boolean;
  isTrial: boolean;
  status: StoreSubscriptionStatus;
  endsAt: Date | null;
  billingPeriod: StoreBillingPeriod;
  finalPrice: number | string | { toString(): string };
  plan?: StorePlanActivationInfo | null;
};

export function findActiveNonTrialSubscription<T extends ActiveStoreSubscriptionInfo>(
  subscriptions: T[],
  now = new Date()
) {
  return subscriptions.find(
    (subscription) =>
      subscription.isActive &&
      !subscription.isTrial &&
      subscription.status === StoreSubscriptionStatus.ACTIVE &&
      subscription.endsAt &&
      new Date(subscription.endsAt) > now &&
      subscription.plan
  );
}

export function assertValidUpgradeTarget(
  activeSubscription: ActiveStoreSubscriptionInfo,
  targetPlan: StorePlanActivationInfo & { id: string },
  billingPeriod: StoreBillingPeriod,
  finalPrice: number
) {
  if (targetPlan.id === activeSubscription.planId) {
    throw new ApiError(
      400,
      'Cannot upgrade to the same plan',
      ErrorCodes.SUBSCRIPTION_SAME_PLAN_NOT_ALLOWED
    );
  }

  if (canActivateStorePlanWithoutPayment(targetPlan, billingPeriod, finalPrice)) {
    throw new ApiError(
      400,
      'Upgrades require a paid plan',
      ErrorCodes.SUBSCRIPTION_FREE_PLAN_UPGRADE_NOT_ALLOWED
    );
  }

  const currentSortOrder = activeSubscription.plan?.sortOrder ?? 0;
  const targetSortOrder = targetPlan.sortOrder ?? 0;
  if (targetSortOrder <= currentSortOrder) {
    throw new ApiError(
      400,
      'Upgrades require a higher plan tier',
      ErrorCodes.SUBSCRIPTION_DOWNGRADE_NOT_ALLOWED
    );
  }
}

export function createPaymentComingSoonError() {
  return new ApiError(
    503,
    'Store subscription payment will be available soon',
    ErrorCodes.PAYMENT_COMING_SOON
  );
}
