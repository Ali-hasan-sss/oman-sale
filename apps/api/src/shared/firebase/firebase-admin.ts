import admin from 'firebase-admin';

import { env } from '../../config/env';
import { ApiError } from '../utils/api-error';

let initialized = false;

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

export type VerifiedGoogleToken = {
  googleId: string;
  email: string;
  fullName: string;
  avatar?: string;
  emailVerified: boolean;
};

export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleToken> {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new ApiError(503, 'Google sign-in is not configured');
  }

  const firebase = ensureFirebaseAdmin();
  const decoded = await firebase.auth().verifyIdToken(idToken);
  const email = decoded.email?.trim().toLowerCase();

  if (!email) throw new ApiError(400, 'Google account email is required');
  if (!decoded.email_verified) throw new ApiError(400, 'Google email is not verified');

  return {
    googleId: decoded.uid,
    email,
    fullName: decoded.name?.trim() || email.split('@')[0] || 'User',
    avatar: decoded.picture,
    emailVerified: true
  };
}
