import admin from 'firebase-admin';

import { env } from '../../config/env';

let initialized = false;

function ensureFirebaseAdmin() {
  if (initialized) return admin;

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.FIREBASE_PROJECT_ID
    });
  } else if (env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
  } else {
    throw new Error('Firebase is not configured');
  }

  initialized = true;
  return admin;
}

export function isFcmConfigured() {
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

export type FcmPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type FcmSendResult = {
  successCount: number;
  invalidTokens: string[];
};

export async function sendFcmToTokens(tokens: string[], payload: FcmPayload): Promise<FcmSendResult> {
  if (!isFcmConfigured() || tokens.length === 0) {
    return { successCount: 0, invalidTokens: [] };
  }

  const firebase = ensureFirebaseAdmin();
  const invalidTokens: string[] = [];
  let successCount = 0;

  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const response = await firebase.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } }
    });

    successCount += response.successCount;
    response.responses.forEach((result, index) => {
      if (result.success) return;
      const code = result.error?.code;
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(chunk[index]!);
      }
    });
  }

  return { successCount, invalidTokens };
}
