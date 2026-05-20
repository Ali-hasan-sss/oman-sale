import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import type { AuthSession, Locale, User } from '../types';

export type UpdateProfilePayload = {
  fullName: string;
  phone?: string;
  bio?: string;
  avatar?: string | null;
};

export async function fetchCurrentUser() {
  const response = await http.get<ApiEnvelope<User>>(API_ENDPOINTS.users.me);
  return response.data.data;
}

export async function updateProfileRequest(payload: UpdateProfilePayload) {
  const response = await http.patch<ApiEnvelope<User>>(API_ENDPOINTS.users.me, payload);
  return response.data.data;
}

export async function changePasswordRequest(currentPassword: string, newPassword: string) {
  await http.patch(API_ENDPOINTS.users.changePassword, { currentPassword, newPassword });
}

export async function requestEmailChangeRequest(email: string, locale: Locale) {
  await http.post(API_ENDPOINTS.users.requestEmailChange, { email, locale });
}

export async function verifyEmailChangeRequest(email: string, code: string) {
  const response = await http.post<ApiEnvelope<AuthSession>>(API_ENDPOINTS.users.verifyEmailChange, {
    email,
    code
  });
  return response.data.data;
}
