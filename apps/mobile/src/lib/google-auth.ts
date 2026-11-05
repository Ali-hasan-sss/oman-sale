import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { getGoogleWebClientId, getPublicWebOrigin, isExpoGo, isFirebaseConfigured } from './firebase';

WebBrowser.maybeCompleteAuthSession();

let configured = false;

type GoogleSigninResponse = {
  type?: string;
  data?: {
    idToken?: string | null;
  };
};

type GoogleSigninModule = {
  GoogleSignin: {
    configure: (config: { webClientId: string; offlineAccess: boolean }) => void;
    hasPlayServices: (config: { showPlayServicesUpdateDialog: boolean }) => Promise<boolean>;
    signIn: () => Promise<GoogleSigninResponse>;
    getTokens: () => Promise<{ idToken: string }>;
    signOut: () => Promise<void>;
    revokeAccess: () => Promise<void>;
  };
  isSuccessResponse: (response: GoogleSigninResponse) => boolean;
  isErrorWithCode: (error: unknown) => error is { code: string };
  statusCodes: { SIGN_IN_CANCELLED: string };
};

function loadGoogleSignin(): GoogleSigninModule | null {
  if (isExpoGo()) return null;

  try {
    return require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  } catch {
    return null;
  }
}

function ensureGoogleSignInConfigured(googleSignin: GoogleSigninModule) {
  if (configured) return;
  const webClientId = getGoogleWebClientId();
  if (!webClientId) return;
  googleSignin.GoogleSignin.configure({ webClientId, offlineAccess: false });
  configured = true;
}

function isCancelError(error: unknown, googleSignin?: GoogleSigninModule | null) {
  if (error instanceof Error && error.message === 'GOOGLE_SIGN_IN_CANCELLED') return true;
  if (!googleSignin?.isErrorWithCode(error)) return false;
  return error.code === googleSignin.statusCodes.SIGN_IN_CANCELLED;
}

async function signInWithNativeModule() {
  const googleSignin = loadGoogleSignin();
  if (!googleSignin) throw new Error('GOOGLE_NATIVE_UNAVAILABLE');

  ensureGoogleSignInConfigured(googleSignin);
  await googleSignin.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  try {
    await googleSignin.GoogleSignin.signOut();
  } catch {
    // Ignore if no cached Google session exists.
  }

  try {
    const response = await googleSignin.GoogleSignin.signIn();
    if (!googleSignin.isSuccessResponse(response)) throw new Error('GOOGLE_SIGN_IN_CANCELLED');

    const idToken = response.data?.idToken || (await googleSignin.GoogleSignin.getTokens()).idToken;
    if (!idToken) throw new Error('GOOGLE_ID_TOKEN_MISSING');
    return idToken;
  } catch (error) {
    if (isCancelError(error, googleSignin)) throw new Error('GOOGLE_SIGN_IN_CANCELLED');
    throw error;
  }
}

async function signInWithGoogleBrowser() {
  const redirectUrl = Linking.createURL('google-auth');
  const startUrl = `${getPublicWebOrigin()}/ar/mobile-google-auth?redirect=${encodeURIComponent(redirectUrl)}`;
  const result = await WebBrowser.openAuthSessionAsync(startUrl, redirectUrl);

  if (result.type !== 'success') throw new Error('GOOGLE_SIGN_IN_CANCELLED');

  const idToken = new URL(result.url).searchParams.get('idToken')?.trim();
  if (idToken) return idToken;

  const error = new URL(result.url).searchParams.get('error');
  if (error === 'not_configured') throw new Error('FIREBASE_NOT_CONFIGURED');
  throw new Error('GOOGLE_SIGN_IN_FAILED');
}

export async function signOutGoogleNative() {
  const googleSignin = loadGoogleSignin();
  if (!googleSignin) return;

  ensureGoogleSignInConfigured(googleSignin);
  try {
    await googleSignin.GoogleSignin.revokeAccess();
  } catch {
    // User may not have signed in with Google.
  }
  try {
    await googleSignin.GoogleSignin.signOut();
  } catch {
    // Ignore if no cached Google session exists.
  }
}

export async function signInWithGoogleNative(): Promise<string> {
  if (!isFirebaseConfigured() || !getGoogleWebClientId()) throw new Error('FIREBASE_NOT_CONFIGURED');

  try {
    return await signInWithNativeModule();
  } catch (error) {
    if (error instanceof Error && error.message === 'GOOGLE_SIGN_IN_CANCELLED') throw error;
    if (error instanceof Error && error.message === 'FIREBASE_NOT_CONFIGURED') throw error;
    return signInWithGoogleBrowser();
  }
}
