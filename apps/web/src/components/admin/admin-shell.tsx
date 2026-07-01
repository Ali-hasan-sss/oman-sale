'use client';

import { BadgeCheck, BarChart3, Building2, ExternalLink, FileText, Flag, FolderTree, Globe, Image, LayoutList, LayoutPanelTop, Lock, LogOut, MapPin, Megaphone, Menu, Newspaper, Store, Users, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, PropsWithChildren, useEffect, useState } from 'react';

import { notifyAuthChanged } from '@/components/auth/user-menu';
import { AdminContentLoader } from '@/components/admin/admin-page-loader';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { adminApi, clearAdminSession, getAdminAccessToken } from '@/lib/admin-auth';
import { ADMIN_PENDING_COUNTS_EVENT } from '@/lib/admin-pending-counts';
import { useI18n } from '@/lib/i18n';

const navItems = [
  { key: 'home', href: '/admin', icon: BarChart3 },
  { key: 'hero', href: '/admin/hero', icon: Image }, 
  { key: 'users', href: '/admin/users', icon: Users },
  { key: 'stores', href: '/admin/stores', icon: Building2 },
  { key: 'categories', href: '/admin/categories', icon: FolderTree },
  { key: 'ads', href: '/admin/ads', icon: LayoutList },
  { key: 'reports', href: '/admin/reports', icon: Flag },
  { key: 'bannerRequests', href: '/admin/banner-requests', icon: LayoutPanelTop },
  { key: 'trustBadges', href: '/admin/trust-badges', icon: BadgeCheck },
  { key: 'promotions', href: '/admin/promotions', icon: Megaphone },
  { key: 'storePlans', href: '/admin/store-plans', icon: Store },
  { key: 'tourism', href: '/admin/tourism', icon: MapPin },
  { key: 'articles', href: '/admin/articles', icon: Newspaper },
  { key: 'legal', href: '/admin/legal', icon: FileText },
] as const;

export function AdminShell({ children }: PropsWithChildren) {
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(getAdminAccessToken());
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [pendingReports, setPendingReports] = useState(0);
  const [pendingBannerRequests, setPendingBannerRequests] = useState(0);
  const [pendingTrustBadges, setPendingTrustBadges] = useState(0);

  const loadPendingCounts = () => {
    Promise.all([
      adminApi().get<{
        data: { pending: { reports: number; bannerRequestsPendingApproval: number } };
      }>('/admin/statistics'),
      adminApi().get<{ data: { total: number } }>('/admin/trust-badges/pending-count')
    ])
      .then(([statisticsResponse, trustBadgesResponse]) => {
        setPendingReports(statisticsResponse.data.data.pending.reports);
        setPendingBannerRequests(statisticsResponse.data.data.pending.bannerRequestsPendingApproval);
        setPendingTrustBadges(trustBadgesResponse.data.data.total);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    if (!getAdminAccessToken()) {
      router.replace(localizedPath('/admin/login'));
      return;
    }

    setIsReady(true);
  }, [router, localizedPath]);

  useEffect(() => {
    if (!isReady) return;

    loadPendingCounts();

    const handlePendingCountsChanged = () => loadPendingCounts();
    window.addEventListener(ADMIN_PENDING_COUNTS_EVENT, handlePendingCountsChanged);
    return () => window.removeEventListener(ADMIN_PENDING_COUNTS_EVENT, handlePendingCountsChanged);
  }, [isReady, pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const logout = () => {
    clearAdminSession();
    notifyAuthChanged();
    router.replace(localizedPath('/admin/login'));
  };

  const openSidebarLabel = locale === 'en' ? 'Open menu' : 'فتح القائمة';
  const closeSidebarLabel = locale === 'en' ? 'Close menu' : 'إغلاق القائمة';
  const visitSiteLabel = locale === 'en' ? 'Visit site' : 'زيارة الموقع';
  const changePasswordLabel = locale === 'en' ? 'Change password' : 'تغيير كلمة المرور';

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage('');
    setPasswordError('');
  };

  const submitPasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError(locale === 'en' ? 'New password and confirmation do not match.' : 'كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    setPasswordSaving(true);
    try {
      await adminApi().post('/auth/admin/change-password', { currentPassword, newPassword });
      setPasswordMessage(locale === 'en' ? 'Password updated successfully.' : 'تم تحديث كلمة المرور بنجاح.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError(locale === 'en' ? 'Could not update password. Check the current password.' : 'تعذر تحديث كلمة المرور. تحقق من كلمة المرور الحالية.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const sidebarContent = (showCloseButton: boolean) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-100 p-5">
        <div className="flex items-center justify-between gap-3">
          <Link href={localizedPath('/admin')} className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <img src="/logo.png" alt="Oman Sale" className="h-full w-full object-contain p-1" />
            </span>
            <div>
              <p className="text-lg font-black">Oman Sale</p>
              <p className="text-xs text-slate-500">{m.admin.dashboard}</p>
            </div>
          </Link>
          {showCloseButton ? (
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
              aria-label={closeSidebarLabel}
              title={closeSidebarLabel}
            >
              <X size={18} />
            </button>
          ) : null}
        </div>
      </div>

      <nav className="admin-sidebar-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === localizedPath(item.href);

          return (
            <Link
              key={item.href}
              href={localizedPath(item.href)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition ${
                active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} />
              <span className="min-w-0 flex-1">{m.admin[item.key]}</span>
              {item.key === 'reports' && pendingReports > 0 ? (
                <span className="ms-auto inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">
                  {pendingReports > 99 ? '99+' : pendingReports}
                </span>
              ) : null}
              {item.key === 'bannerRequests' && pendingBannerRequests > 0 ? (
                <span className="ms-auto inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">
                  {pendingBannerRequests > 99 ? '99+' : pendingBannerRequests}
                </span>
              ) : null}
              {item.key === 'trustBadges' && pendingTrustBadges > 0 ? (
                <span className="ms-auto inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">
                  {pendingTrustBadges > 99 ? '99+' : pendingTrustBadges}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-100 p-5">
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800"
        >
          <LogOut size={18} />
          {m.admin.logout}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100" dir={dir}>
      {sidebarOpen ? (
        <button
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label={closeSidebarLabel}
        />
      ) : null}

      <aside
        className={`hidden h-full w-72 shrink-0 flex-col bg-white shadow-sm lg:flex ${
          dir === 'rtl' ? 'border-l border-slate-200' : 'border-r border-slate-200'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      <aside
        className={`fixed inset-y-0 z-40 flex h-full w-72 flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden ${
          dir === 'rtl' ? `right-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}` : `left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        }`}
      >
        {sidebarContent(true)}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 lg:hidden"
                aria-label={openSidebarLabel}
                title={openSidebarLabel}
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-sm text-slate-500">{m.admin.platformManagement}</p>
                <h1 className="text-xl font-black text-slate-900">{m.admin.dashboardTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell variant="admin" showViewAllLink={false} />
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:px-4"
              >
                <Lock size={16} />
                <span className="hidden md:inline">{changePasswordLabel}</span>
              </button>
              <Link
                href={localizedPath('/')}
                className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
              >
                <ExternalLink size={16} />
                {visitSiteLabel}
              </Link>
              <button
                onClick={toggleLocale}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Globe size={16} />
                  {m.common.languageSwitch}
                </span>
              </button>
              <button
                onClick={logout}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 lg:hidden"
              >
                {m.admin.logoutShort}
              </button>
            </div>
          </div>
        </header>

        <main className="admin-content-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-8 lg:px-8">
          {isReady ? children : <AdminContentLoader label={m.admin.loading} />}
        </main>
      </div>

      {passwordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form onSubmit={submitPasswordChange} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">{changePasswordLabel}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {locale === 'en' ? 'Update the admin account password.' : 'حدّث كلمة مرور حساب الأدمن.'}
                </p>
              </div>
              <button type="button" onClick={closePasswordModal} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                <X size={18} />
              </button>
            </div>

            {passwordError ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{passwordError}</p> : null}
            {passwordMessage ? <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{passwordMessage}</p> : null}

            <div className="space-y-4">
              <PasswordField label={locale === 'en' ? 'Current password' : 'كلمة المرور الحالية'} value={currentPassword} onChange={setCurrentPassword} />
              <PasswordField label={locale === 'en' ? 'New password' : 'كلمة المرور الجديدة'} value={newPassword} onChange={setNewPassword} minLength={8} />
              <PasswordField label={locale === 'en' ? 'Confirm new password' : 'تأكيد كلمة المرور الجديدة'} value={confirmPassword} onChange={setConfirmPassword} minLength={8} />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordSaving ? (locale === 'en' ? 'Saving...' : 'جاري الحفظ...') : changePasswordLabel}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function PasswordField({ label, minLength = 1, onChange, value }: { label: string; minLength?: number; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        minLength={minLength}
        required
      />
    </label>
  );
}
