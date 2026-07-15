'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { resolvePendingThawaniSession } from '@/lib/thawani-session';
import { getUserAccessToken } from '@/lib/user-auth';

type ConfirmEndpoint =
  | '/stores/payments/thawani/confirm'
  | '/promotions/payments/thawani/confirm'
  | '/banner-requests/payments/thawani/confirm';

export type ThawaniPaymentConfirmResult = {
  adId?: string;
  promotionId?: string;
  action?: 'create' | 'promote';
  storeId?: string;
  storeAction?: 'create' | 'upgrade' | 'renew';
  alreadyPaid?: boolean;
};

type UseThawaniPaymentConfirmOptions = {
  confirmEndpoint: ConfirmEndpoint;
  loginPath: string;
  onSuccess?: (result: ThawaniPaymentConfirmResult) => void;
};

export function useThawaniPaymentConfirm({
  confirmEndpoint,
  loginPath,
  onSuccess
}: UseThawaniPaymentConfirmOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(true);
  const [failed, setFailed] = useState(false);
  const [missingSession, setMissingSession] = useState(false);

  useEffect(() => {
    const token = getUserAccessToken();
    if (!token) {
      router.replace(loginPath);
      return;
    }

    const sessionId = resolvePendingThawaniSession(searchParams.get('session_id'));
    if (!sessionId) {
      setMissingSession(true);
      setIsConfirming(false);
      return;
    }

    api
      .post<{ data: ThawaniPaymentConfirmResult }>(confirmEndpoint, { sessionId })
      .then((response) => onSuccess?.(response.data.data))
      .catch(() => setFailed(true))
      .finally(() => setIsConfirming(false));
  }, [confirmEndpoint, loginPath, onSuccess, router, searchParams]);

  return { isConfirming, failed, missingSession };
}
