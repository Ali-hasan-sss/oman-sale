'use client';

import { getRedirectResult, signInWithRedirect } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { getFirebaseAuth, googleAuthProvider, isFirebaseConfigured } from '@/lib/firebase';

const redirectStorageKey = 'oman_sale_mobile_google_redirect';

function isAllowedAppRedirect(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'omansale:' || url.protocol === 'exp:' || url.protocol === 'exps:';
  } catch {
    return false;
  }
}

function returnToApp(redirect: string, params: Record<string, string>) {
  const back = new URL(redirect);
  for (const [key, value] of Object.entries(params)) {
    back.searchParams.set(key, value);
  }
  window.location.replace(back.toString());
}

export function MobileGoogleAuthPage() {
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [message, setMessage] = useState('جاري فتح حساب Google...');

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const requested = searchParams.get('redirect')?.trim() || '';
    const stored = window.sessionStorage.getItem(redirectStorageKey) || '';
    const redirect = isAllowedAppRedirect(requested) ? requested : isAllowedAppRedirect(stored) ? stored : '';

    if (!redirect) {
      setMessage('تعذر الرجوع إلى التطبيق.');
      return;
    }

    window.sessionStorage.setItem(redirectStorageKey, redirect);

    if (!isFirebaseConfigured()) {
      returnToApp(redirect, { error: 'not_configured' });
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      returnToApp(redirect, { error: 'not_configured' });
      return;
    }

    void getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user) {
          await signInWithRedirect(auth, googleAuthProvider);
          return;
        }

        const idToken = await result.user.getIdToken();
        window.sessionStorage.removeItem(redirectStorageKey);
        returnToApp(redirect, { idToken });
      })
      .catch(() => {
        window.sessionStorage.removeItem(redirectStorageKey);
        returnToApp(redirect, { error: 'failed' });
      });
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
      <p className="text-lg font-bold text-slate-800">{message}</p>
    </main>
  );
}
