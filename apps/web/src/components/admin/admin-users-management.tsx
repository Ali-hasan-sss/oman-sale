'use client';

import { Eye, Plus, Power, PowerOff, Search, ShieldCheck, ShieldOff, UserCheck, UserX, X } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

import { AdminTableSkeleton } from '@/components/admin/admin-table-skeleton';
import { VerifiedEntityAvatar } from '@/components/trust-badge/verified-entity-avatar';
import { PasswordInput } from '@/components/ui/password-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { adminApi } from '@/lib/admin-auth';
import { resolveApiErrorMessage } from '@/lib/api-errors';
import { useI18n } from '@/lib/i18n';
import { isValidPhoneE164 } from '@/lib/phone/phone-utils';

type ManagedUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  trustBadgeApproved?: boolean;
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

type CreateUserForm = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: ManagedUser['role'];
  isVerified: boolean;
  isActive: boolean;
};

const emptyCreateForm = (): CreateUserForm => ({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'USER',
  isVerified: true,
  isActive: true
});

export function AdminUsersManagement() {
  const { locale, localizedPath, m } = useI18n();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>(emptyCreateForm());
  const [isSaving, setIsSaving] = useState(false);

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

  const openCreateForm = () => {
    setCreateForm(emptyCreateForm());
    setMessage('');
    setError(undefined);
    setShowCreateForm(true);
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);
    setCreateForm(emptyCreateForm());
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);
    setMessage('');

    try {
      const phone = createForm.phone.trim();
      if (phone && !isValidPhoneE164(phone)) {
        setError(m.auth.phoneInvalid);
        return;
      }

      await adminApi().post('/admin/users', {
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        phone: phone || null,
        isVerified: createForm.isVerified,
        isActive: createForm.isActive
      });
      setMessage(m.admin.userCreatedSuccess);
      closeCreateForm();
      await loadUsers();
    } catch (caught) {
      setError(resolveApiErrorMessage(caught, {}, m.admin.userCreateError));
    } finally {
      setIsSaving(false);
    }
  };

  const updateUser = async (userId: string, payload: Partial<ManagedUser>) => {
    await adminApi().patch(`/admin/users/${userId}`, payload);
    await loadUsers();
  };

  useEffect(() => {
    void loadUsers();
  }, [role, m.admin.usersLoadError]);

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

          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
            <button
              type="button"
              onClick={showCreateForm ? closeCreateForm : openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              {showCreateForm ? <X size={18} /> : <Plus size={18} />}
              {showCreateForm ? m.admin.cancel : m.admin.createUser}
            </button>
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
              onChange={(event) => {
                setRole(event.target.value);
              }}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">{m.admin.allRoles}</option>
              <option value="USER">{m.admin.user}</option>
              <option value="MODERATOR">{m.admin.moderator}</option>
              <option value="ADMIN">{m.admin.admin}</option>
            </select>
            <button
              type="button"
              onClick={loadUsers}
              className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700"
            >
              {m.admin.search}
            </button>
          </div>
        </div>

        {showCreateForm ? (
          <form
            onSubmit={createUser}
            className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2"
          >
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.fullName}</span>
              <input
                required
                minLength={2}
                value={createForm.fullName}
                onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.email}</span>
              <input
                required
                type="email"
                dir="ltr"
                value={createForm.email}
                onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <div className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.phoneOptional}</span>
              <PhoneInput
                value={createForm.phone}
                onChange={(value) => setCreateForm((current) => ({ ...current, phone: value }))}
                locale={locale}
                searchPlaceholder={m.auth.searchCountry}
              />
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.password}</span>
              <PasswordInput
                required
                minLength={8}
                value={createForm.password}
                onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.role}</span>
              <select
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, role: event.target.value as ManagedUser['role'] }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="USER">{m.admin.user}</option>
                <option value="MODERATOR">{m.admin.moderator}</option>
                <option value="ADMIN">{m.admin.admin}</option>
              </select>
            </label>
            <div className="flex flex-wrap items-end gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={createForm.isVerified}
                  onChange={(event) => setCreateForm((current) => ({ ...current, isVerified: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                {m.admin.verified}
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={createForm.isActive}
                  onChange={(event) => setCreateForm((current) => ({ ...current, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                {m.admin.active}
              </label>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {isSaving ? m.admin.saving : m.admin.createUser}
              </button>
            </div>
          </form>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">{message}</div>
        ) : null}

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
                <AdminTableSkeleton
                  asBodyOnly
                  rows={10}
                  columnTypes={['avatar-text', 'badge', 'badges', 'short', 'short', 'text', 'actions']}
                />
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <VerifiedEntityAvatar
                          src={user.avatar}
                          name={user.fullName}
                          className="h-11 w-11 rounded-xl"
                          verified={user.trustBadgeApproved}
                          verifiedTitle={m.trustBadge.verifiedLabel}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900">{user.fullName}</div>
                          <div className="text-slate-500">{user.email}</div>
                          {user.phone ? <div className="text-xs text-slate-400">{user.phone}</div> : null}
                        </div>
                      </div>
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
