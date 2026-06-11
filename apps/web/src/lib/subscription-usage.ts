import { STORE_BILLING_PERIOD_DAYS, type StoreBillingPeriod } from '@/lib/store-billing-period';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const SUBSCRIPTION_RENEWAL_WINDOW_DAYS = 2;

export function canRenewActiveSubscriptionWithinWindow(endsAt: string | Date, now = new Date()) {
  const endsMs = new Date(endsAt).getTime();
  const nowMs = now.getTime();
  if (endsMs <= nowMs) return false;

  const windowMs = SUBSCRIPTION_RENEWAL_WINDOW_DAYS * MS_PER_DAY;
  return endsMs - nowMs <= windowMs;
}

export function getSubscriptionTimeUsage(input: {
  startsAt?: string | null;
  endsAt?: string | null;
  billingPeriod: StoreBillingPeriod;
}) {
  const now = Date.now();
  const endsAtMs = input.endsAt ? new Date(input.endsAt).getTime() : null;

  if (!endsAtMs) return null;

  const startsAtMs = input.startsAt
    ? new Date(input.startsAt).getTime()
    : endsAtMs - STORE_BILLING_PERIOD_DAYS[input.billingPeriod] * MS_PER_DAY;

  const totalMs = Math.max(endsAtMs - startsAtMs, MS_PER_DAY);
  const elapsedMs = Math.min(Math.max(now - startsAtMs, 0), totalMs);
  const remainingMs = Math.max(endsAtMs - now, 0);

  const totalDays = Math.max(1, Math.ceil(totalMs / MS_PER_DAY));
  const elapsedDays = Math.min(totalDays, Math.ceil(elapsedMs / MS_PER_DAY));
  const remainingDays = Math.max(0, Math.ceil(remainingMs / MS_PER_DAY));

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    elapsedRatio: elapsedMs / totalMs
  };
}

export function getEffectiveSubscriptionMaxListings(input: {
  isTrial: boolean;
  maxListings: number;
  baselineListings?: number;
  trialMaxListings?: number;
}) {
  const baseline = input.baselineListings ?? 0;
  const planAllowance =
    input.isTrial && (input.trialMaxListings ?? 0) > 0 ? input.trialMaxListings! : input.maxListings;

  return baseline + planAllowance;
}

export function getSubscriptionPlanListingAllowance(input: {
  isTrial: boolean;
  maxListings: number;
  trialMaxListings?: number;
}) {
  if (input.isTrial && (input.trialMaxListings ?? 0) > 0) {
    return input.trialMaxListings!;
  }
  return input.maxListings;
}

export function getListingsUsageColor(used: number, total: number) {
  if (total <= 0) return '#16a34a';
  const ratio = used / total;
  if (ratio >= 1) return '#dc2626';
  if (ratio >= 0.8) return '#d97706';
  return '#16a34a';
}

export function getTimeUsageColor(elapsedRatio: number) {
  if (elapsedRatio >= 0.9) return '#dc2626';
  if (elapsedRatio >= 0.7) return '#d97706';
  return '#16a34a';
}
