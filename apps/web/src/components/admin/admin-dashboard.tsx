'use client';

import { BadgeDollarSign, FileClock, Megaphone, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type AdminStats = {
  users: number;
  ads: number;
  pendingAds: number;
  payments: number;
};

const statMeta = [
  { key: 'users', labelKey: 'users', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { key: 'ads', labelKey: 'ads', icon: Megaphone, color: 'bg-brand-50 text-brand-600' },
  { key: 'pendingAds', labelKey: 'pendingAds', icon: FileClock, color: 'bg-amber-50 text-amber-600' },
  { key: 'payments', labelKey: 'payments', icon: BadgeDollarSign, color: 'bg-purple-50 text-purple-600' }
] as const;

export function AdminDashboard() {
  const { locale, m } = useI18n();
  const [stats, setStats] = useState<AdminStats>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    adminApi()
      .get<{ data: AdminStats }>('/admin/statistics')
      .then((response) => setStats(response.data.data))
      .catch(() => setError(m.admin.statsError));
  }, [m.admin.statsError]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-8 text-white shadow-soft">
        <p className="mb-2 text-sm font-bold text-white/75">{m.admin.welcome}</p>
        <h2 className="mb-3 text-3xl font-black">{m.admin.dashboardHeroTitle}</h2>
        <p className="max-w-2xl text-white/80">{m.admin.dashboardHeroText}</p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      ) : null}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statMeta.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.key} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}>
                  <Icon size={26} />
                </div>
                <span className="text-sm text-slate-400">{m.admin.total}</span>
              </div>
              <p className="text-sm font-bold text-slate-500">{m.admin[item.labelKey]}</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {stats ? stats[item.key].toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US') : '...'}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-xl font-black">{m.admin.upcomingTasks}</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            {m.admin.tasks.map((task) => (
              <li key={task} className="rounded-2xl bg-slate-50 p-4">
                {task}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-xl font-black">{m.admin.systemStatus}</h3>
          <div className="space-y-3 text-sm">
            <Status label="API" ready={m.admin.ready} />
            <Status label="PostgreSQL" ready={m.admin.ready} />
            <Status label="Redis / Queues" ready={m.admin.ready} />
          </div>
        </article>
      </section>
    </div>
  );
}

function Status({ label, ready }: { label: string; ready: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
      <span className="font-bold text-slate-700">{label}</span>
      <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">{ready}</span>
    </div>
  );
}
