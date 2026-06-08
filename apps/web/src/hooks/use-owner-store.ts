'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { getUserAccessToken } from '@/lib/user-auth';
import { useAuthStore } from '@/store/auth-store';

export type OwnerStoreSummary = {
  id: string;
  nameAr: string;
  nameEn: string;
  accessStatus: string;
};

export function useOwnerStore() {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [store, setStore] = useState<OwnerStoreSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    const token = accessToken ?? getUserAccessToken();

    if (!token) {
      setStore(null);
      setLoaded(true);
      return;
    }

    let active = true;
    setLoaded(false);

    api
      .get<{ data: OwnerStoreSummary[] }>('/stores/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        if (!active) return;
        setStore(response.data.data[0] ?? null);
      })
      .catch(() => {
        if (!active) return;
        setStore(null);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  return { store, hasStore: Boolean(store), loaded };
}
