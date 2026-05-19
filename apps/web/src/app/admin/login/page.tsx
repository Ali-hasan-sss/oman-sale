'use client';

import { Globe } from 'lucide-react';

import { AdminLoginForm } from '@/components/admin/admin-login-form';
import { useI18n } from '@/lib/i18n';

export default function AdminLoginPage() {
  const { dir, m, toggleLocale } = useI18n();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-brand-950 to-brand-800 px-4 py-10" dir={dir}>
      <button
        onClick={toggleLocale}
        className="fixed left-6 top-6 z-20 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/90 px-4 py-2 text-sm font-bold text-slate-800 shadow-soft transition hover:bg-white"
      >
        <Globe size={16} />
        {m.common.languageSwitch}
      </button>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-soft lg:grid-cols-2">
          <section className="hidden bg-gradient-to-br from-brand-700 to-brand-900 p-10 text-white lg:block">
            <div className="mb-20 flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">
                <img src="/logo.png" alt="Oman Sale" className="h-full w-full object-contain p-1" />
              </span>
              <div>
                <h1 className="text-2xl font-black">Oman Sale</h1>
                <p className="text-sm text-white/70">{m.admin.adminDashboard}</p>
              </div>
            </div>
            <h2 className="mb-4 text-4xl font-black leading-tight">{m.admin.loginSideTitle}</h2>
            <p className="max-w-md text-white/80">{m.admin.loginSideText}</p>
          </section>

          <section className="p-8 md:p-12">
            <div className="mb-8">
              <p className="mb-2 text-sm font-bold text-brand-600">{m.admin.dashboard}</p>
              <h2 className="text-3xl font-black text-slate-900">{m.admin.loginTitle}</h2>
              <p className="mt-2 text-sm text-slate-500">{m.admin.loginSubtitle}</p>
            </div>
            <AdminLoginForm />
          </section>
        </div>
      </div>
    </main>
  );
}
