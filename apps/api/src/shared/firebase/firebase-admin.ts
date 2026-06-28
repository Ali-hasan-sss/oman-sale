import admin from 'firebase-admin';
import { OAuth2Client } from 'google-auth-library';

import { env } from '../../config/env';
import { ApiError } from '../utils/api-error';

let initialized = false;
let googleOAuthClient: OAuth2Client | null = null;

function ensureFirebaseAdmin() {
  if (initialized) return admin;

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.FIREBASE_PROJECT_ID
    });
  } else {
    admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
  }

  initialized = true;
  return admin;
}

function getGoogleOAuthClient() {
  if (!googleOAuthClient) googleOAuthClient = new OAuth2Client();
  return googleOAuthClient;
}

export type VerifiedGoogleToken = {
  googleId: string;
  email: string;
  fullName: string;
  avatar?: string;
  emailVerified: boolean;
};

// Web (Firebase Auth) sends a Firebase ID token; the Google sub lives in the
// `firebase.identities['google.com']` claim. We key our users on the Google sub
// so the same account resolves identically across web and mobile.
function verifyFirebaseIdToken(idToken: string): Promise<VerifiedGoogleToken> {
  const firebase = ensureFirebaseAdmin();
  return firebase
    .auth()
    .verifyIdToken(idToken)
    .then((decoded) => {
      const email = decoded.email?.trim().toLowerCase();
      if (!email) throw new ApiError(400, 'Google account email is required');
      if (!decoded.email_verified) throw new ApiError(400, 'Google email is not verified');

      const googleIdentities = (decoded.firebase?.identities?.['google.com'] as string[] | undefined) ?? [];
      const googleId = googleIdentities[0] ?? decoded.uid;

      return {
        googleId,
        email,
        fullName: decoded.name?.trim() || email.split('@')[0] || 'User',
        avatar: decoded.picture,
        emailVerified: true
      };
    });
}

// Mobile (native @react-native-google-signin) sends a raw Google OAuth ID token
// issued by accounts.google.com with the web client ID as its audience.
async function verifyGoogleOAuthIdToken(idToken: string): Promise<VerifiedGoogleToken> {
  const ticket = await getGoogleOAuthClient().verifyIdToken({
    idToken,
    audience: env.GOOGLE_WEB_CLIENT_ID || undefined
  });

  const payload = ticket.getPayload();
  if (!payload) throw new ApiError(401, 'Invalid Google token');

  const email = payload.email?.trim().toLowerCase();
  if (!email) throw new ApiError(400, 'Google account email is required');
  if (!payload.email_verified) throw new ApiError(400, 'Google email is not verified');

  return {
    googleId: payload.sub,
    email,
    fullName: payload.name?.trim() || email.split('@')[0] || 'User',
    avatar: payload.picture,
    emailVerified: true
  };
}

export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleToken> {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new ApiError(503, 'Google sign-in is not configured');
  }

  try {
    return await verifyFirebaseIdToken(idToken);
  } catch (firebaseError) {
    // Surface our own validation errors (unverified email, etc.) directly.
    if (firebaseError instanceof ApiError) throw firebaseError;

    // Not a Firebase ID token — fall back to verifying it as a native Google
    // OAuth ID token (mobile sign-in).
    try {
      return await verifyGoogleOAuthIdToken(idToken);
    } catch (oauthError) {
      if (oauthError instanceof ApiError) throw oauthError;
      throw new ApiError(401, 'Invalid Google token');
    }
  }
}
