'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { resolvePendingThawaniSession } from '@/lib/thawani-session';
import { getUserAccessToken } from '@/lib/user-auth';

type CancelEndpoint = '/stores/payments/thawani/cancel' | '/promotions/payments/thawani/cancel';

type UseThawaniPaymentCancelOptions = {
  cancelEndpoint: CancelEndpoint;
  loginPath: string;
  onDone?: () => void;
};

export function useThawaniPaymentCancel({
  cancelEndpoint,
  loginPath,
  onDone
}: UseThawaniPaymentCancelOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const token = getUserAccessToken();
    if (!token) {
      router.replace(loginPath);
      return;
    }

    const sessionId = resolvePendingThawaniSession(searchParams.get('session_id'));
    if (!sessionId) {
      setIsProcessing(false);
      onDone?.();
      return;
    }

    api
      .post(cancelEndpoint, { sessionId })
      .catch(() => undefined)
      .finally(() => {
        setIsProcessing(false);
        onDone?.();
      });
  }, [cancelEndpoint, loginPath, onDone, router, searchParams]);

  return { isProcessing };
}
