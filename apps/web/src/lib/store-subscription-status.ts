export type StoreSubscriptionStatusCode = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

const statusLabels = {
  ar: {
    PENDING: 'قيد الانتظار',
    ACTIVE: 'نشط',
    EXPIRED: 'منتهي',
    CANCELLED: 'ملغى',
    TRIAL: 'تجريبي'
  },
  en: {
    PENDING: 'Pending',
    ACTIVE: 'Active',
    EXPIRED: 'Expired',
    CANCELLED: 'Cancelled',
    TRIAL: 'Trial'
  }
} as const;

const statusStyles: Record<StoreSubscriptionStatusCode, string> = {
  PENDING: 'bg-amber-100 text-amber-900 ring-amber-200',
  ACTIVE: 'bg-green-100 text-green-800 ring-green-200',
  EXPIRED: 'bg-slate-100 text-slate-700 ring-slate-200',
  CANCELLED: 'bg-red-100 text-red-800 ring-red-200'
};

export function getSubscriptionStatusLabel(
  status: string,
  locale: 'ar' | 'en',
  isTrial?: boolean
) {
  if (isTrial && status === 'ACTIVE') {
    return statusLabels[locale].TRIAL;
  }
  const key = status as StoreSubscriptionStatusCode;
  return statusLabels[locale][key] ?? status;
}

export function getSubscriptionStatusBadgeClass(status: string, isTrial?: boolean) {
  if (isTrial && status === 'ACTIVE') {
    return 'bg-amber-100 text-amber-900 ring-amber-200';
  }
  return statusStyles[status as StoreSubscriptionStatusCode] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
}
