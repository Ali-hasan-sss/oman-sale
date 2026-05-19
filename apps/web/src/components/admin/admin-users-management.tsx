'use client';

import { Eye, Power, PowerOff, Search, ShieldCheck, ShieldOff, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type ManagedUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
  _count: {
    ads: number;
    payments: number;
    reports: number;
  };
};

type UsersResponse = {
  items: ManagedUser[];
  total: number;
  page: number;
  limit: number;
};

export function AdminUsersManagement() {
  const { locale, localizedPath, m } = useI18n();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadUsers = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await adminApi().get<{ data: UsersResponse }>('/admin/users', {
        params: {
          q: query || undefined,
          role: role || undefined,
          page: 1,
          limit: 30
        }
      });
      setUsers(response.data.data.items);
      setTotal(response.data.data.total);
    } catch {
      setError(m.admin.usersLoadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [role, m.admin.usersLoadError]);

  const updateUser = async (userId: string, payload: Partial<ManagedUser>) => {
    await adminApi().patch(`/admin/users/${userId}`, payload);
    await loadUsers();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">{m.admin.usersManagement}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {m.admin.totalResults}: {total.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') loadUsers();
                }}
                placeholder={m.admin.searchUsers}
                className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-11 outline-none focus:ring-2 focus:ring-brand-100 md:w-80"
              />
            </div>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">{m.admin.allRoles}</option>
              <option value="USER">{m.admin.user}</option>
              <option value="MODERATOR">{m.admin.moderator}</option>
              <option value="ADMIN">{m.admin.admin}</option>
            </select>
            <button
              onClick={loadUsers}
              className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700"
            >
              {m.admin.search}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="px-4 py-3">{m.admin.user}</th>
                <th className="px-4 py-3">{m.admin.role}</th>
                <th className="px-4 py-3">{m.admin.status}</th>
                <th className="px-4 py-3">{m.admin.ads}</th>
                <th className="px-4 py-3">{m.admin.reports}</th>
                <th className="px-4 py-3">{m.admin.joinedAt}</th>
                <th className="px-4 py-3">{m.admin.actions}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    {m.admin.loadingUsers}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{user.fullName}</div>
                      <div className="text-slate-500">{user.email}</div>
                      {user.phone ? <div className="text-xs text-slate-400">{user.phone}</div> : null}
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge role={user.role} labels={m.admin} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <StateBadge active={user.isActive} label={user.isActive ? m.admin.active : m.admin.inactive} />
                        <StateBadge active={!user.isBlocked} label={user.isBlocked ? m.admin.blocked : m.admin.notBlocked} />
                        <StateBadge active={user.isVerified} label={user.isVerified ? m.admin.verified : m.admin.notVerified} />
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold">{user._count.ads}</td>
                    <td className="px-4 py-4 font-bold">{user._count.reports}</td>
                    <td className="px-4 py-4 text-slate-500">
                      {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-US').format(new Date(user.createdAt))}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={localizedPath(`/admin/users/${user.id}`)}
                          title={m.admin.viewUser}
                          aria-label={m.admin.viewUser}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => updateUser(user.id, { isBlocked: !user.isBlocked })}
                          title={user.isBlocked ? m.admin.unblock : m.admin.block}
                          aria-label={user.isBlocked ? m.admin.unblock : m.admin.block}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800"
                        >
                          {user.isBlocked ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateUser(user.id, { isVerified: !user.isVerified })}
                          title={user.isVerified ? m.admin.unverify : m.admin.verify}
                          aria-label={user.isVerified ? m.admin.unverify : m.admin.verify}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700"
                        >
                          {user.isVerified ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                          title={user.isActive ? m.admin.disable : m.admin.enable}
                          aria-label={user.isActive ? m.admin.disable : m.admin.enable}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                        >
                          {user.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RoleBadge({ role, labels }: { role: ManagedUser['role']; labels: ReturnType<typeof useI18n>['m']['admin'] }) {
  const label = role === 'ADMIN' ? labels.admin : role === 'MODERATOR' ? labels.moderator : labels.user;
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{label}</span>;
}

function StateBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        active ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {label}
    </span>
  );
}
