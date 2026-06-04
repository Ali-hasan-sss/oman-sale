import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';

export type StoreBillingPeriod = 'MONTHLY' | 'YEARLY';

export type StorePlanPricing = {
  id: string;
  billingPeriod: StoreBillingPeriod;
  price: string | number;
  finalPrice?: number;
  maxListings: number;
};

export type StorePlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  pricing: StorePlanPricing[];
};

export type CreateStorePayload = {
  nameAr: string;
  nameEn: string;
  bioAr?: string;
  bioEn?: string;
  phone: string;
  nationalId: string;
  commercialRegistrationNumber: string;
  rootCategoryId: string;
  storeTypeId: string;
  city: string;
  planId: string;
  billingPeriod: StoreBillingPeriod;
  logoUrl?: string;
  coverUrl?: string;
};

export type CreateStoreResult = {
  store: { id: string; slug: string };
  checkout?: { paymentUrl?: string };
  requiresPayment: boolean;
  isFreePlan: boolean;
};

export type PublicStore = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  bioAr?: string;
  bioEn?: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  city?: string | null;
  listingsCount?: number;
  rootCategory?: { id: string; nameAr: string; nameEn: string; slug: string };
  storeType?: { id: string; nameAr: string; nameEn: string; slug: string; icon?: string | null } | null;
  owner?: { id: string; fullName: string; avatar?: string | null } | null;
};

export type StoreType = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon?: string | null;
};

export type PublicStoresResponse = {
  items: PublicStore[];
  total: number;
  page: number;
  limit: number;
};

export type OwnerStore = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  bioAr?: string;
  bioEn?: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  isActive: boolean;
  accessStatus: 'ACTIVE' | 'TRIAL' | 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED' | 'DISABLED';
  requiresPayment: boolean;
  rootCategory?: { id?: string; nameAr?: string; nameEn?: string };
  subscriptions: Array<{
    id: string;
    planId: string;
    status: string;
    isActive: boolean;
    isTrial: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
    maxListings: number;
    finalPrice?: string | number;
    billingPeriod: StoreBillingPeriod;
    plan?: { id: string; nameAr: string; nameEn: string; trialMaxListings?: number };
  }>;
};

export async function fetchMyStores() {
  const response = await http.get<ApiEnvelope<OwnerStore[]>>(API_ENDPOINTS.stores.mine);
  return response.data.data;
}

export async function fetchPublicStores(params?: {
  q?: string;
  rootCategoryId?: string;
  storeTypeId?: string;
  city?: string;
  page?: number;
  limit?: number;
}) {
  const response = await http.get<ApiEnvelope<PublicStoresResponse>>(API_ENDPOINTS.stores.root, { params });
  return response.data.data;
}

export async function fetchPublicStoreBySlug(slug: string) {
  const response = await http.get<ApiEnvelope<PublicStore>>(API_ENDPOINTS.stores.bySlug(slug));
  return response.data.data;
}

export async function fetchPublicStoreAds(slug: string, params?: { page?: number; limit?: number }) {
  const response = await http.get<ApiEnvelope<{ items: import('../types').Listing[]; total: number; page: number; limit: number }>>(
    API_ENDPOINTS.stores.adsBySlug(slug),
    { params }
  );
  return response.data.data;
}

export async function updateStoreRequest(
  storeId: string,
  payload: Partial<Pick<OwnerStore, 'bioAr' | 'bioEn' | 'logoUrl' | 'coverUrl'>>
) {
  const response = await http.patch<ApiEnvelope<OwnerStore>>(API_ENDPOINTS.stores.byId(storeId), payload);
  return response.data.data;
}

export async function fetchStoreAds(storeId: string) {
  const response = await http.get<ApiEnvelope<{ items: import('../types').Listing[] }>>(API_ENDPOINTS.stores.ads(storeId), {
    params: { page: 1, limit: 20 }
  });
  return response.data.data.items;
}

export async function activateStorePaidRequest(storeId: string, locale: 'ar' | 'en') {
  const response = await http.post<ApiEnvelope<{ checkout?: { paymentUrl?: string; activated?: boolean } }>>(
    API_ENDPOINTS.stores.activatePaid(storeId),
    undefined,
    { params: { locale } }
  );
  return response.data.data;
}

export async function renewStoreSubscriptionRequest(
  storeId: string,
  payload: { planId: string; billingPeriod: StoreBillingPeriod },
  locale: 'ar' | 'en'
) {
  const response = await http.post<ApiEnvelope<{ checkout?: { paymentUrl?: string; activated?: boolean } }>>(
    API_ENDPOINTS.stores.subscribe(storeId),
    payload,
    { params: { locale } }
  );
  return response.data.data;
}

export async function fetchStoreTypes() {
  const response = await http.get<ApiEnvelope<StoreType[]>>(API_ENDPOINTS.stores.storeTypes);
  return response.data.data;
}

export async function fetchStorePlans(rootCategoryId: string) {
  const response = await http.get<ApiEnvelope<StorePlan[]>>(`${API_ENDPOINTS.stores.plans}`, {
    params: { rootCategoryId }
  });
  return response.data.data;
}

export async function createStoreRequest(payload: CreateStorePayload, locale: 'ar' | 'en') {
  const response = await http.post<ApiEnvelope<CreateStoreResult>>(API_ENDPOINTS.stores.root, payload, {
    params: { locale }
  });
  return response.data.data;
}

export async function deleteStoreRequest(storeId: string) {
  const response = await http.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(API_ENDPOINTS.stores.byId(storeId));
  return response.data.data;
}

export async function confirmStorePaymentRequest(sessionId: string) {
  const response = await http.post<ApiEnvelope<unknown>>(API_ENDPOINTS.stores.confirmPayment, { sessionId });
  return response.data.data;
}
