'use client';

import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import { HeaderNavButtonsPreview } from '@/components/admin/header-nav-buttons-preview';
import { adminApi } from '@/lib/admin-auth';
import { type HeaderNavButtonRecord } from '@/lib/header-nav';
import { useI18n } from '@/lib/i18n';

type HeaderButtonForm = {
  sortOrder: number;
  labelAr: string;
  labelEn: string;
  linkUrl: string;
  isActive: boolean;
};

const emptyForm = (): HeaderButtonForm => ({
  sortOrder: 0,
  labelAr: '',
  labelEn: '',
  linkUrl: '',
  isActive: true
});

export function AdminHeaderButtonsManagement() {
  const { m } = useI18n();
  const [buttons, setButtons] = useState<HeaderNavButtonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HeaderButtonForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi().get<{ data: HeaderNavButtonRecord[] }>('/admin/header-nav-buttons');
      setButtons(response.data.data);
    } catch {
      setError(m.admin.headerButtonsLoadError);
    } finally {
      setLoading(false);
    }
  }, [m.admin.headerButtonsLoadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateField = <K extends keyof HeaderButtonForm>(key: K, value: HeaderButtonForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      sortOrder: buttons.length > 0 ? Math.max(...buttons.map((button) => button.sortOrder)) + 1 : 0
    });
    setShowForm(true);
    setError(null);
  };

  const openEdit = (button: HeaderNavButtonRecord) => {
    setEditingId(button.id);
    setForm({
      sortOrder: button.sortOrder,
      labelAr: button.labelAr,
      labelEn: button.labelEn,
      linkUrl: button.linkUrl,
      isActive: button.isActive
    });
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await adminApi().patch(`/admin/header-nav-buttons/${editingId}`, form);
      } else {
        await adminApi().post('/admin/header-nav-buttons', form);
      }
      closeForm();
      await load();
    } catch {
      setError(m.admin.headerButtonsSaveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(m.admin.headerButtonsDeleteConfirm)) return;
    setError(null);
    try {
      await adminApi().delete(`/admin/header-nav-buttons/${id}`);
      if (editingId === id) closeForm();
      await load();
    } catch {
      setError(m.admin.headerButtonsDeleteError);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{m.admin.headerButtonsTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{m.admin.headerButtonsHint}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white"
        >
          <Plus size={18} />
          {m.admin.headerButtonsAdd}
        </button>
      </div>

      <HeaderNavButtonsPreview buttons={buttons} />

      {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-black text-slate-900">
                {editingId ? m.admin.headerButtonsEdit : m.admin.headerButtonsAdd}
              </h3>
              <button type="button" onClick={closeForm} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.headerButtonLabelAr}</span>
              <input
                required
                value={form.labelAr}
                onChange={(event) => updateField('labelAr', event.target.value)}
                className={inputClass}
                placeholder={m.admin.headerButtonLabelArPlaceholder}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.headerButtonLabelEn}</span>
              <input
                required
                value={form.labelEn}
                onChange={(event) => updateField('labelEn', event.target.value)}
                className={inputClass}
                placeholder={m.admin.headerButtonLabelEnPlaceholder}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.headerButtonLink}</span>
              <input
                required
                value={form.linkUrl}
                onChange={(event) => updateField('linkUrl', event.target.value)}
                className={inputClass}
                dir="ltr"
                placeholder="/category/jobs-wanted"
              />
              <p className="mt-1 text-xs text-slate-500">{m.admin.headerButtonLinkHint}</p>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.sortOrder}</span>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) => updateField('sortOrder', Number(event.target.value))}
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateField('isActive', event.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-bold text-slate-700">{m.admin.isActive}</span>
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? m.admin.heroSaving : editingId ? m.admin.headerButtonsSave : m.admin.headerButtonsAdd}
            </button>
            <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700">
              {m.admin.cancel}
            </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-slate-500">{m.admin.loading}</p>
        ) : buttons.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            {m.admin.headerButtonsEmpty}
          </p>
        ) : (
          <div className="space-y-3">
            {buttons.map((button) => (
              <article key={button.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-slate-900">{button.labelAr}</p>
                    <p className="text-sm text-slate-500">{button.labelEn}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        button.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {button.isActive ? m.admin.active : m.admin.inactive}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600" dir="ltr">
                    {button.linkUrl} · #{button.sortOrder}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => openEdit(button)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                    <Edit3 size={18} />
                  </button>
                  <button type="button" onClick={() => void handleDelete(button.id)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50">
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
