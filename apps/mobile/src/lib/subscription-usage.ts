const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const SUBSCRIPTION_RENEWAL_WINDOW_DAYS = 2;

export function canRenewActiveSubscriptionWithinWindow(endsAt: string | Date, now = new Date()) {
  const endsMs = new Date(endsAt).getTime();
  const nowMs = now.getTime();
  if (endsMs <= nowMs) return false;

  const windowMs = SUBSCRIPTION_RENEWAL_WINDOW_DAYS * MS_PER_DAY;
  return endsMs - nowMs <= windowMs;
}
