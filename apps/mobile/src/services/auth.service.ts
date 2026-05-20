import { isAxiosError } from 'axios';

import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import type { AuthSession, Locale } from '../types';

export const EMAIL_VERIFICATION_REQUIRED = 'Email verification required';

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

export async function loginRequest(email: string, password: string) {
  const response = await http.post<ApiEnvelope<AuthSession>>(API_ENDPOINTS.auth.login, { email, password });
  return response.data.data;
}

export async function registerRequest(payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  locale: Locale;
}) {
  const response = await http.post<ApiEnvelope<{ email: string; pendingVerification: true }>>(
    API_ENDPOINTS.auth.register,
    payload
  );
  return response.data.data;
}

export async function verifyEmailRequest(email: string, code: string) {
  const response = await http.post<ApiEnvelope<AuthSession>>(API_ENDPOINTS.auth.verifyEmail, { email, code });
  return response.data.data;
}

export async function resendVerificationRequest(email: string, locale: Locale) {
  await http.post(API_ENDPOINTS.auth.resendVerification, { email, locale });
}

export async function forgotPasswordRequest(email: string, locale: Locale) {
  await http.post(API_ENDPOINTS.auth.forgotPassword, { email, locale });
}

export async function resetPasswordRequest(email: string, code: string, password: string) {
  await http.post(API_ENDPOINTS.auth.resetPassword, { email, code, password });
}

export async function refreshTokensRequest(refreshToken: string) {
  const response = await http.post<ApiEnvelope<AuthSession['tokens']>>(
    API_ENDPOINTS.auth.refresh,
    { refreshToken },
    { headers: { 'X-Skip-Auth-Refresh': '1' } }
  );
  return response.data.data;
}

export async function fetchCurrentUser() {
  const response = await http.get<ApiEnvelope<AuthSession['user']>>(API_ENDPOINTS.users.me);
  return response.data.data;
}
