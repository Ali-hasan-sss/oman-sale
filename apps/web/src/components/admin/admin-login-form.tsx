'use client';

import { Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { api } from '@/lib/api';
import { notifyAuthChanged } from '@/components/auth/user-menu';
import { saveAdminSession, type AdminLoginResponse } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

export function AdminLoginForm() {
  const { localizedPath, m } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('admin@omansale.local');
  const [password, setPassword] = useState('Admin12345');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    try {
      const response = await api.post<{ data: AdminLoginResponse }>('/auth/admin/login', {
        email,
        password
      });
      saveAdminSession(response.data.data);
      notifyAuthChanged();
      router.push(localizedPath('/admin'));
    } catch {
      setError(m.admin.loginError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">{m.admin.email}</label>
        <div className="relative">
          <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-11 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="admin@omansale.local"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">{m.admin.password}</label>
        <div className="relative">
          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-11 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? m.admin.loggingIn : m.admin.loginButton}
      </button>
    </form>
  );
}
