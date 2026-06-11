'use client';

import {
  getSubscriptionStatusBadgeClass,
  getSubscriptionStatusLabel
} from '@/lib/store-subscription-status';

type StoreSubscriptionStatusBadgeProps = {
  status: string;
  locale: 'ar' | 'en';
  isTrial?: boolean;
};

export function StoreSubscriptionStatusBadge({ status, locale, isTrial }: StoreSubscriptionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${getSubscriptionStatusBadgeClass(status, isTrial)}`}
    >
      {getSubscriptionStatusLabel(status, locale, isTrial)}
    </span>
  );
}
