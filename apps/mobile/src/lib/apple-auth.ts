import { Platform } from 'react-native';

import { isExpoGo } from './firebase';

type AppleFullName = {
  givenName?: string | null;
  familyName?: string | null;
};

type AppleCredential = {
  identityToken?: string | null;
  fullName?: AppleFullName | null;
};

type AppleAuthModule = {
  signInAsync: (options: {
    requestedScopes: number[];
  }) => Promise<AppleCredential>;
  isAvailableAsync: () => Promise<boolean>;
  AppleAuthenticationScope: {
    FULL_NAME: number;
    EMAIL: number;
  };
};

function loadAppleAuth(): AppleAuthModule | null {
  if (Platform.OS !== 'ios') return null;
  if (isExpoGo()) return null;

  try {
    return require('expo-apple-authentication') as AppleAuthModule;
  } catch {
    return null;
  }
}

export function isAppleSignInSupported() {
  return Platform.OS === 'ios';
}

export function formatAppleFullName(name?: AppleFullName | null) {
  if (!name) return undefined;
  const fullName = [name.givenName, name.familyName].filter(Boolean).join(' ').trim();
  return fullName || undefined;
}

export async function signInWithAppleNative(): Promise<{ identityToken: string; fullName?: string }> {
  const appleAuth = loadAppleAuth();
  if (!appleAuth) throw new Error('APPLE_NATIVE_UNAVAILABLE');

  const available = await appleAuth.isAvailableAsync().catch(() => false);
  if (!available) throw new Error('APPLE_NATIVE_UNAVAILABLE');

  try {
    const credential = await appleAuth.signInAsync({
      requestedScopes: [appleAuth.AppleAuthenticationScope.FULL_NAME, appleAuth.AppleAuthenticationScope.EMAIL]
    });
    const identityToken = credential.identityToken?.trim();
    if (!identityToken) throw new Error('APPLE_SIGN_IN_CANCELLED');

    return {
      identityToken,
      fullName: formatAppleFullName(credential.fullName)
    };
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === 'ERR_REQUEST_CANCELED') throw new Error('APPLE_SIGN_IN_CANCELLED');
    throw error;
  }
}
