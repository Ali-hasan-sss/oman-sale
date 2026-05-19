'use client';

import { Edit3, ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type HeroBannerRecord = {
  id: string;
  sortOrder: number;
  imageUrl: string;
  textAr?: string | null;
  textEn?: string | null;
  linkUrl: string;
  isActive: boolean;
};

type HeroBannerForm = Omit<HeroBannerRecord, 'id'>;

const emptyForm = (): HeroBannerForm => ({
  sortOrder: 0,
  imageUrl: '',
  textAr: '',
  textEn: '',
  linkUrl: '',
  isActive: true
});

export function AdminHeroBannersManagement() {
  const { m } = useI18n();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [banners, setBanners] = useState<HeroBannerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<HeroBannerForm>(emptyForm());

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi().get<{ data: HeroBannerRecord[] }>('/admin/hero-banners');
      setBanners(response.data.data);
    } catch {
      setError(m.admin.bannerLoadError);
    } finally {
      setLoading(false);
    }
  }, [m.admin.bannerLoadError]);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  const scrollToForm = () => {
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      sortOrder: banners.length > 0 ? Math.max(...banners.map((banner) => banner.sortOrder)) + 1 : 0
    });
    setShowForm(true);
    scrollToForm();
  };

  const openEdit = (banner: HeroBannerRecord) => {
    setEditingId(banner.id);
    setForm({
      sortOrder: banner.sortOrder,
      imageUrl: banner.imageUrl,
      textAr: banner.textAr ?? '',
      textEn: banner.textEn ?? '',
      linkUrl: banner.linkUrl,
      isActive: banner.isActive
    });
    setShowForm(true);
    scrollToForm();
  };

  const closeForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyForm());
  };

  const updateField = <K extends keyof HeroBannerForm>(key: K, value: HeroBannerForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await adminApi().patch(`/admin/hero-banners/${editingId}`, form);
      } else {
        await adminApi().post('/admin/hero-banners', form);
      }
      closeForm();
      await loadBanners();
    } catch {
      setError(m.admin.bannerSaveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(m.admin.bannerDeleteConfirm)) return;
    setError(null);
    try {
      await adminApi().delete(`/admin/hero-banners/${id}`);
      if (editingId === id) closeForm();
      await loadBanners();
    } catch {
      setError(m.admin.bannerDeleteError);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{m.admin.bannerManagement}</h2>
          <p className="mt-1 text-sm text-slate-500">{m.admin.bannerManagementHint}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          <Plus size={18} />
          {m.admin.createBanner}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>
      ) : null}

      {showForm ? (
        <form ref={formRef} onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">
              {editingId ? m.admin.updateBanner : m.admin.createBanner}
            </h3>
            <button type="button" onClick={closeForm} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <X size={20} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.bannerImageUrl}</span>
              <input
                required
                value={form.imageUrl}
                onChange={(event) => updateField('imageUrl', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </label>
            {form.imageUrl ? (
              <div className="md:col-span-2 overflow-hidden rounded-2xl border border-slate-200">
                <img src={form.imageUrl} alt="" className="aspect-[990/250] w-full object-cover" />
              </div>
            ) : null}
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.bannerTextAr}</span>
              <input
                value={form.textAr ?? ''}
                onChange={(event) => updateField('textAr', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.bannerTextEn}</span>
              <input
                value={form.textEn ?? ''}
                onChange={(event) => updateField('textEn', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.bannerLinkUrl}</span>
              <input
                required
                value={form.linkUrl}
                onChange={(event) => updateField('linkUrl', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                dir="ltr"
                placeholder="/all-listings أو https://example.com"
              />
              <p className="mt-1 text-xs text-slate-500">{m.admin.bannerLinkHint}</p>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.sortOrder}</span>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) => updateField('sortOrder', Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
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

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? m.admin.bannerSaving : editingId ? m.admin.updateBanner : m.admin.createBanner}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700"
            >
              {m.admin.cancel}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">{m.admin.loading}</p>
      ) : banners.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          {m.admin.bannerEmpty}
        </p>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <article key={banner.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 md:w-56">
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <ImageIcon size={28} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-slate-900">{banner.textAr || m.admin.bannerNoText}</p>
                    <p className="text-sm text-slate-500">{banner.textEn || m.admin.bannerNoText}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${banner.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {banner.isActive ? m.admin.active : m.admin.inactive}
                  </span>
                </div>
                <p className="mt-2 truncate text-xs text-slate-500" dir="ltr">
                  {banner.linkUrl} · #{banner.sortOrder}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => openEdit(banner)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                  <Edit3 size={18} />
                </button>
                <button type="button" onClick={() => void handleDelete(banner.id)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50">
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
