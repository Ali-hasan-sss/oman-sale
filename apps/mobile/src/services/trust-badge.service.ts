import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';

export type TrustBadgeStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type UserTrustBadge = {
  trustBadgeStatus: TrustBadgeStatus;
  trustBadgeApproved: boolean;
  trustIdentityDocType?: 'NATIONAL_ID' | 'PASSPORT' | null;
  trustIdentityDocUrl?: string | null;
  trustBadgeRejectionReason?: string | null;
};

export type StoreTrustBadge = {
  trustBadgeStatus: TrustBadgeStatus;
  trustBadgeApproved: boolean;
  trustCommercialRegDocUrl?: string | null;
  trustOcciDocUrl?: string | null;
  trustSmeDocUrl?: string | null;
  trustOtherDocUrl?: string | null;
  trustOtherDocLabel?: string | null;
  trustBadgeRejectionReason?: string | null;
};

export async function fetchUserTrustBadge() {
  const response = await http.get<ApiEnvelope<UserTrustBadge>>(API_ENDPOINTS.trustBadge.userMe);
  return response.data.data;
}

export async function submitUserTrustBadge(payload: {
  documentType: 'NATIONAL_ID' | 'PASSPORT';
  documentUrl: string;
}) {
  const response = await http.post<ApiEnvelope<UserTrustBadge>>(API_ENDPOINTS.trustBadge.userMe, payload);
  return response.data.data;
}

export async function fetchStoreTrustBadge(storeId: string) {
  const response = await http.get<ApiEnvelope<StoreTrustBadge>>(API_ENDPOINTS.trustBadge.store(storeId));
  return response.data.data;
}

export async function submitStoreTrustBadge(
  storeId: string,
  payload: {
    commercialRegDocUrl: string;
    occiDocUrl?: string;
    smeDocUrl?: string;
    otherDocUrl?: string;
    otherDocLabel?: string;
  }
) {
  const response = await http.post<ApiEnvelope<StoreTrustBadge>>(API_ENDPOINTS.trustBadge.store(storeId), payload);
  return response.data.data;
}
