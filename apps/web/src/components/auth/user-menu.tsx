'use client';

import { Heart, LayoutDashboard, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { clearAdminSession, getAdminAccessToken, getStoredAdminUser, type AdminUser } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';
import { disconnectRealtimeSocket } from '@/lib/realtime';
import { clearUserSession } from '@/lib/user-auth';
import { useAuthStore } from '@/store/auth-store';

const AUTH_CHANGED_EVENT = 'oman-sale-auth-changed';

const logoutDialogLabels = {
  ar: {
    title: 'تأكيد تسجيل الخروج',
    description: 'هل تريد تسجيل الخروج من حسابك الآن؟ ستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى حسابك.',
    confirm: 'تسجيل الخروج',
    cancel: 'إلغاء'
  },
  en: {
    title: 'Confirm logout',
    description: 'Do you want to log out now? You will need to sign in again to access your account.',
    confirm: 'Log out',
    cancel: 'Cancel'
  }
};

export const notifyAuthChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
};

type HeaderAuthActionProps = {
  loginClassName: string;
};

export function HeaderAuthAction({ loginClassName }: HeaderAuthActionProps) {
  const { localizedPath, m } = useI18n();
  const user = useAuthStore((state) => state.user);
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const [adminUser, setAdminUser] = useState<AdminUser | undefined>();

  const syncSessions = useCallback(() => {
    hydrateFromStorage();
    const token = getAdminAccessToken();
    const storedAdmin = getStoredAdminUser();
    setAdminUser(token && storedAdmin ? storedAdmin : undefined);
  }, [hydrateFromStorage]);

  useEffect(() => {
    syncSessions();
    window.addEventListener(AUTH_CHANGED_EVENT, syncSessions);
    window.addEventListener('storage', syncSessions);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncSessions);
      window.removeEventListener('storage', syncSessions);
    };
  }, [syncSessions]);

  if (adminUser) {
    return <AdminMenu admin={adminUser} />;
  }

  if (!user) {
    return (
      <Link className={loginClassName} href={localizedPath('/login')}>
        {m.common.login}
      </Link>
    );
  }

  return <UserMenu />;
}

function AdminMenu({ admin }: { admin: AdminUser }) {
  const router = useRouter();
  const { locale, localizedPath, m } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const logoutText = logoutDialogLabels[locale];

  const logout = () => {
    clearAdminSession();
    notifyAuthChanged();
    setIsOpen(false);
    setIsLogoutDialogOpen(false);
    router.push(localizedPath('/'));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-black text-brand-700 shadow-lg ring-2 ring-brand-200 transition hover:ring-brand-400"
        aria-label={admin.fullName}
      >
        {admin.avatar ? (
          <img src={admin.avatar} alt={admin.fullName} className="h-full w-full rounded-full object-cover" />
        ) : (
          <User size={22} />
        )}
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
          {m.common.adminRole}
        </span>
      </button>

      {isOpen ? (
        <div className="absolute end-0 z-50 mt-3 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 bg-brand-50 px-4 py-3">
            <p className="line-clamp-1 font-bold text-gray-900">{admin.fullName}</p>
            <p className="line-clamp-1 text-xs text-gray-500">{admin.email}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-brand-700">{m.common.adminRole}</p>
          </div>
          <Link
            href={localizedPath('/admin')}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
          >
            <LayoutDashboard size={16} />
            {m.common.adminDashboard}
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsLogoutDialogOpen(true);
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} />
            {m.common.logout}
          </button>
        </div>
      ) : null}

      {isLogoutDialogOpen ? (
        <ConfirmationDialog
          title={logoutText.title}
          description={logoutText.description}
          confirmLabel={logoutText.confirm}
          cancelLabel={logoutText.cancel}
          onCancel={() => setIsLogoutDialogOpen(false)}
          onConfirm={logout}
          variant="danger"
        />
      ) : null}
    </div>
  );
}

function UserMenu() {
  const router = useRouter();
  const { locale, localizedPath, m } = useI18n();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const logoutText = logoutDialogLabels[locale];

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(window.navigator.onLine);

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const logout = () => {
    disconnectRealtimeSocket();
    clearUserSession();
    clearSession();
    notifyAuthChanged();
    setIsOpen(false);
    setIsLogoutDialogOpen(false);
    router.push(localizedPath('/login'));
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-black text-green-700 shadow-lg ring-1 ring-gray-200 transition hover:ring-green-400"
        aria-label={user.fullName}
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.fullName} className="h-full w-full rounded-full object-cover" />
        ) : (
          <User size={22} />
        )}
        <span
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isOnline ? m.common.online : m.common.offline}
        />
      </button>

      {isOpen ? (
        <div className="absolute end-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="line-clamp-1 font-bold text-gray-900">{user.fullName}</p>
            <p className="line-clamp-1 text-xs text-gray-500">{user.email}</p>
          </div>
          <Link
            href={localizedPath('/profile')}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <User size={16} />
            {m.common.profile}
          </Link>
          <Link
            href={localizedPath('/favorites')}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <Heart size={16} />
            {m.common.favorites}
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsLogoutDialogOpen(true);
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} />
            {m.common.logout}
          </button>
        </div>
      ) : null}

      {isLogoutDialogOpen ? (
        <ConfirmationDialog
          title={logoutText.title}
          description={logoutText.description}
          confirmLabel={logoutText.confirm}
          cancelLabel={logoutText.cancel}
          onCancel={() => setIsLogoutDialogOpen(false)}
          onConfirm={logout}
          variant="danger"
        />
      ) : null}
    </div>
  );
}
