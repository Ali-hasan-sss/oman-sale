import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export function isFirebaseConfigured() {
  return Constants.appOwnership !== 'expo' && Boolean(extra.googleWebClientId);
}

export function getGoogleWebClientId() {
  return extra.googleWebClientId ?? '';
}
