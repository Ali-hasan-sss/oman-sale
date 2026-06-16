'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useI18n } from '@/lib/i18n';
import { getStoredUser, getUserAccessToken } from '@/lib/user-auth';
import { useAuthStore } from '@/store/auth-store';

const PROFILE_COMPLETION_ALLOWED_PATHS = [
  '/complete-profile',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

function normalizePath(pathname: string) {
  const withoutLocale = pathname.replace(/^\/(ar|en)(?=\/|$)/, '');
  return withoutLocale || '/';
}

function isAllowedDuringProfileCompletion(pathname: string) {
  const path = normalizePath(pathname);
  return PROFILE_COMPLETION_ALLOWED_PATHS.some((allowed) => path === allowed || path.startsWith(`${allowed}/`));
}

export function ProfileCompletionGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { localizedPath } = useI18n();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const token = getUserAccessToken();
    const currentUser = user ?? getStoredUser();
    if (!token || !currentUser || currentUser.profileCompleted !== false) return;
    if (isAllowedDuringProfileCompletion(pathname)) return;

    router.replace(localizedPath('/complete-profile'));
  }, [localizedPath, pathname, router, user]);

  return null;
}
