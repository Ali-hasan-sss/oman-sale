'use client';

import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

import { getFirebaseApp } from './firebase';
import { getNotificationApiClient } from './notification-session';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const buildServiceWorkerUrl = () => {
  const params = new URLSearchParams();
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
};

let registered = false;
let foregroundBound = false;

/**
 * Registers the browser for FCM web push so notifications arrive even when the
 * user is away from the site. Safe to call repeatedly — it no-ops when already
 * registered, unsupported, or when there is no active session.
 */
export async function registerWebPush(onForeground?: () => void): Promise<void> {
  if (typeof window === 'undefined' || registered) return;
  if (!VAPID_KEY) return;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;

  const supported = await isSupported().catch(() => false);
  if (!supported) return;

  const app = getFirebaseApp();
  if (!app) return;

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.register(buildServiceWorkerUrl());
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) return;

    const client = getNotificationApiClient();
    if (!client) return;

    await client.post('/notifications/push-token', { token, platform: 'WEB' });
    registered = true;

    if (!foregroundBound) {
      foregroundBound = true;
      onMessage(messaging, () => {
        onForeground?.();
      });
    }
  } catch (error) {
    console.error('[web-push] registration failed', error);
  }
}

export function resetWebPushRegistration() {
  registered = false;
}
