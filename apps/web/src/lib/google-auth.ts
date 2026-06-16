'use client';

import { signInWithPopup } from 'firebase/auth';

import { getFirebaseAuth, googleAuthProvider, isFirebaseConfigured } from '@/lib/firebase';

export async function signInWithGooglePopup() {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const auth = getFirebaseAuth();
  if (!auth) throw new Error('FIREBASE_NOT_CONFIGURED');

  const result = await signInWithPopup(auth, googleAuthProvider);
  return result.user.getIdToken();
}
