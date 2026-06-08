'use client';

import { useEffect } from 'react';

import { syncCurrentUser } from '@/lib/sync-current-user';
import { getUserAccessToken } from '@/lib/user-auth';

export function UserSessionBootstrap() {
  useEffect(() => {
    if (!getUserAccessToken()) return;
    void syncCurrentUser();
  }, []);

  return null;
}
