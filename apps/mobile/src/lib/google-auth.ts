import Constants from 'expo-constants';

import { getGoogleWebClientId, isFirebaseConfigured } from './firebase';

let configured = false;

type GoogleSigninResponse = {
  data?: {
    idToken?: string | null;
  };
};

type GoogleSigninModule = {
  GoogleSignin: {
    configure: (config: { webClientId: string; offlineAccess: boolean }) => void;
    hasPlayServices: (config: { showPlayServicesUpdateDialog: boolean }) => Promise<boolean>;
    signIn: (options?: { prompt?: 'select_account' | 'consent' }) => Promise<GoogleSigninResponse>;
    signOut: () => Promise<void>;
    revokeAccess: () => Promise<void>;
  };
  isSuccessResponse: (response: GoogleSigninResponse) => boolean;
};

function loadGoogleSignin(): GoogleSigninModule | null {
  if (Constants.appOwnership === 'expo') return null;

  try {
    // Lazy require so Expo Go (which lacks the native module) doesn't crash at
    // app startup. Only triggered when the user taps the Google button.
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
  if (!isFirebaseConfigured()) throw new Error('FIREBASE_NOT_CONFIGURED');
  if (!getGoogleWebClientId()) throw new Error('FIREBASE_NOT_CONFIGURED');

  const googleSignin = loadGoogleSignin();
  if (!googleSignin) throw new Error('GOOGLE_NATIVE_UNAVAILABLE');

  ensureGoogleSignInConfigured(googleSignin);
  await googleSignin.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  try {
    await googleSignin.GoogleSignin.signOut();
  } catch {
    // Ignore if no cached Google session exists.
  }

  const response = await googleSignin.GoogleSignin.signIn({ prompt: 'select_account' });
  if (!googleSignin.isSuccessResponse(response)) throw new Error('GOOGLE_SIGN_IN_CANCELLED');

  const idToken = response.data?.idToken;
  if (!idToken) throw new Error('GOOGLE_SIGN_IN_CANCELLED');

  return idToken;
}
