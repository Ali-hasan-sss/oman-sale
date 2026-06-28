import { isAxiosError } from 'axios';

import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import { ApiErrorCodes, getApiErrorCode } from '../lib/api-errors';
import type { AuthSession, Locale, User } from '../types';

export const EMAIL_VERIFICATION_REQUIRED = 'Email verification required';

export type PhoneVerificationChannel = 'whatsapp' | 'sms';

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

export function isEmailVerificationRequiredError(error: unknown) {
  if (getApiErrorCode(error) === ApiErrorCodes.EMAIL_VERIFICATION_REQUIRED) return true;
  return isAxiosError<{ message?: string }>(error) && error.response?.data?.message === EMAIL_VERIFICATION_REQUIRED;
}

export async function loginRequest(email: string, password: string) {
  const response = await http.post<ApiEnvelope<AuthSession>>(API_ENDPOINTS.auth.login, { email, password });
  return response.data.data;
}

export async function googleAuthRequest(idToken: string) {
  const response = await http.post<ApiEnvelope<AuthSession>>(API_ENDPOINTS.auth.google, { idToken });
  return response.data.data;
}

export async function registerStartRequest(payload: { fullName: string; email: string; locale: Locale }) {
  await http.post(API_ENDPOINTS.auth.registerStart, payload);
}

export async function registerVerifyEmailRequest(email: string, code: string) {
  await http.post(API_ENDPOINTS.auth.registerVerifyEmail, { email, code });
}

export async function registerResendEmailRequest(email: string, locale: Locale) {
  await http.post(API_ENDPOINTS.auth.registerResendEmail, { email, locale });
}

export async function registerSendPhoneCodeRequest(payload: {
  email: string;
  phone: string;
  locale: Locale;
  channel: PhoneVerificationChannel;
}) {
  await http.post(API_ENDPOINTS.auth.registerSendPhone, payload);
}

export async function registerVerifyPhoneRequest(payload: { email: string; phone: string; code: string }) {
  await http.post(API_ENDPOINTS.auth.registerVerifyPhone, payload);
}

export async function registerResendPhoneRequest(payload: {
  email: string;
  phone: string;
  locale: Locale;
  channel: PhoneVerificationChannel;
}) {
  await http.post(API_ENDPOINTS.auth.registerResendPhone, payload);
}

export async function registerCompleteRequest(payload: {
  email: string;
  phone: string;
  password: string;
  locale: Locale;
}) {
  const response = await http.post<ApiEnvelope<AuthSession>>(API_ENDPOINTS.auth.register, payload);
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

export async function completeProfileSendPhoneRequest(payload: {
  phone: string;
  locale: Locale;
  channel: PhoneVerificationChannel;
}) {
  await http.post(API_ENDPOINTS.auth.completeProfileSendPhone, payload);
}

export async function completeProfileVerifyPhoneRequest(phone: string, code: string) {
  await http.post(API_ENDPOINTS.auth.completeProfileVerifyPhone, { phone, code });
}

export async function completeProfileRequest(payload: { fullName: string; phone: string; password: string }) {
  const response = await http.post<ApiEnvelope<{ user: User }>>(API_ENDPOINTS.auth.completeProfile, payload);
  return response.data.data.user;
}

export async function fetchCurrentUser() {
  const response = await http.get<ApiEnvelope<AuthSession['user']>>(API_ENDPOINTS.users.me);
  return response.data.data;
}
