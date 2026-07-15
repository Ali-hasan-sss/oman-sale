const LISTING_PAYMENT_RETURN_KEY = 'listing_payment_return';
const STORE_PAYMENT_RETURN_KEY = 'store_payment_return';

const MAX_AGE_MS = 10 * 60 * 1000;

export type ListingPaymentReturn = {
  adId: string;
  promotionId?: string;
  action: 'create' | 'promote';
  at: number;
};

export type StorePaymentReturn = {
  storeId?: string;
  action: 'create' | 'upgrade' | 'renew';
  at: number;
};

function isFresh(at: number) {
  return Date.now() - at <= MAX_AGE_MS;
}

export function storeListingPaymentReturn(input: Omit<ListingPaymentReturn, 'at'>) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    LISTING_PAYMENT_RETURN_KEY,
    JSON.stringify({ ...input, at: Date.now() } satisfies ListingPaymentReturn)
  );
}

export function consumeListingPaymentReturn(): ListingPaymentReturn | null {
  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(LISTING_PAYMENT_RETURN_KEY);
  sessionStorage.removeItem(LISTING_PAYMENT_RETURN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ListingPaymentReturn;
    if (!parsed.adId || !isFresh(parsed.at)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeStorePaymentReturn(input: Omit<StorePaymentReturn, 'at'>) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    STORE_PAYMENT_RETURN_KEY,
    JSON.stringify({ ...input, at: Date.now() } satisfies StorePaymentReturn)
  );
}

export function consumeStorePaymentReturn(): StorePaymentReturn | null {
  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(STORE_PAYMENT_RETURN_KEY);
  sessionStorage.removeItem(STORE_PAYMENT_RETURN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StorePaymentReturn;
    if (!isFresh(parsed.at)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const freshFetchHeaders = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache'
} as const;

export function freshFetchParams(refresh = true) {
  return refresh ? { _ts: Date.now() } : {};
}
