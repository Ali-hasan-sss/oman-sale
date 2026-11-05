import Constants from 'expo-constants';

import { getApiBaseUrl } from './api/client';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export function getGoogleWebClientId() {
  return extra.googleWebClientId?.trim() || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '';
}

export function getPublicWebOrigin() {
  const configured = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  try {
    const api = new URL(getApiBaseUrl());
    if (api.port === '4000') api.port = '3000';
    return api.origin;
  } catch {
    return 'https://omansale.om';
  }
}

export function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

export function isFirebaseConfigured() {
  return Boolean(getGoogleWebClientId());
}
