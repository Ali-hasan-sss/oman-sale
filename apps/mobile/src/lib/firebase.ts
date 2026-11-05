import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export function getGoogleWebClientId() {
  return extra.googleWebClientId?.trim() || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '';
}

export function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

export function isFirebaseConfigured() {
  return Boolean(getGoogleWebClientId());
}
