'use client';

import { FormEvent, useEffect, useState } from 'react';

import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type LegalKind = 'terms' | 'privacy';

type LegalDocument = {
  kind: LegalKind;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  contactTitleAr: string;
  contactTitleEn: string;
  contactTextAr: string;
  contactTextEn: string;
  isPublished: boolean;
  publishedAt?: string | null;
  updatedAt: string;
};

type LegalForm = Omit<LegalDocument, 'kind' | 'publishedAt' | 'updatedAt'>;

const emptyForm: LegalForm = {
  titleAr: '',
  titleEn: '',
  bodyAr: '',
  bodyEn: '',
  contactTitleAr: '',
  contactTitleEn: '',
  contactTextAr: '',
  contactTextEn: '',
  isPublished: false
};

const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500';

export function AdminLegalManagement() {
  const { m } = useI18n();
  const [activeKind, setActiveKind] = useState<LegalKind>('terms');
  const [forms, setForms] = useState<Record<LegalKind, LegalForm>>({
    terms: emptyForm,
    privacy: emptyForm
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi().get<{ data: LegalDocument[] }>('/admin/legal');
      const next: Record<LegalKind, LegalForm> = { terms: { ...emptyForm }, privacy: { ...emptyForm } };
      for (const item of response.data.data) {
        next[item.kind] = {
          titleAr: item.titleAr,
          titleEn: item.titleEn,
          bodyAr: item.bodyAr,
          bodyEn: item.bodyEn,
          contactTitleAr: item.contactTitleAr,
          contactTitleEn: item.contactTitleEn,
          contactTextAr: item.contactTextAr,
          contactTextEn: item.contactTextEn,
          isPublished: item.isPublished
        };
      }
      setForms(next);
    } catch {
      setError(m.admin.legalLoadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const form = forms[activeKind];

  const updateForm = (patch: Partial<LegalForm>) => {
    setForms((current) => ({ ...current, [activeKind]: { ...current[activeKind], ...patch } }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminApi().put(`/admin/legal/${activeKind}`, form);
      setSuccess(m.admin.legalSaveSuccess);
      await load();
    } catch {
      setError(m.admin.legalSaveError);
    } finally {
      setSaving(false);
    }
  };

  const tabs: Array<{ kind: LegalKind; label: string }> = [
    { kind: 'terms', label: m.admin.legalTermsTab },
    { kind: 'privacy', label: m.admin.legalPrivacyTab }
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-brand-800 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-black">{m.admin.legalManagement}</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/80">{m.admin.legalManagementHint}</p>
      </section>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            onClick={() => setActiveKind(tab.kind)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeKind === tab.kind ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 shadow-sm'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">{m.admin.loading}</p>
      ) : (
        <form onSubmit={submit} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm text-slate-500">{m.admin.legalPreviewHint}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-700">{m.admin.legalTitleAr}</span>
              <input className={inputClass} value={form.titleAr} onChange={(e) => updateForm({ titleAr: e.target.value })} required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-700">{m.admin.legalTitleEn}</span>
              <input className={inputClass} value={form.titleEn} onChange={(e) => updateForm({ titleEn: e.target.value })} required />
            </label>
          </div>

          <RichTextEditor
            label={m.admin.legalBodyAr}
            value={form.bodyAr}
            onChange={(value) => updateForm({ bodyAr: value })}
          />
          <RichTextEditor
            label={m.admin.legalBodyEn}
            value={form.bodyEn}
            onChange={(value) => updateForm({ bodyEn: value })}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-700">{m.admin.legalContactTitleAr}</span>
              <input
                className={inputClass}
                value={form.contactTitleAr}
                onChange={(e) => updateForm({ contactTitleAr: e.target.value })}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-700">{m.admin.legalContactTitleEn}</span>
              <input
                className={inputClass}
                value={form.contactTitleEn}
                onChange={(e) => updateForm({ contactTitleEn: e.target.value })}
              />
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-700">{m.admin.legalContactTextAr}</span>
              <textarea
                className={inputClass}
                rows={2}
                value={form.contactTextAr}
                onChange={(e) => updateForm({ contactTextAr: e.target.value })}
              />
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-700">{m.admin.legalContactTextEn}</span>
              <textarea
                className={inputClass}
                rows={2}
                value={form.contactTextEn}
                onChange={(e) => updateForm({ contactTextEn: e.target.value })}
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => updateForm({ isPublished: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {m.admin.legalPublished}
          </label>

          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
          {success ? <p className="text-sm font-bold text-brand-700">{success}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? m.admin.loading : m.admin.save}
          </button>
        </form>
      )}
    </div>
  );
}
