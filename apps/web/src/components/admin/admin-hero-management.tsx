'use client';

import { Edit3, ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { AdminHeroMobilePreview } from '@/components/admin/admin-hero-mobile-preview';
import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type HeroSlidePlatform = 'WEB' | 'MOBILE';
type HeroPlatformFilter = 'ALL' | HeroSlidePlatform;

const normalizePlatform = (platform?: HeroSlidePlatform | string): HeroSlidePlatform =>
  platform === 'MOBILE' ? 'MOBILE' : 'WEB';

type HeroSlideRecord = {
  id: string;
  sortOrder: number;
  platform: HeroSlidePlatform;
  imageUrl: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  buttonLabelAr: string;
  buttonLabelEn: string;
  buttonLink: string;
  isActive: boolean;
};

type HeroSlideForm = Omit<HeroSlideRecord, 'id'>;

const emptyForm = (): HeroSlideForm => ({
  sortOrder: 0,
  platform: 'WEB',
  imageUrl: '',
  titleAr: '',
  titleEn: '',
  subtitleAr: '',
  subtitleEn: '',
  buttonLabelAr: '',
  buttonLabelEn: '',
  buttonLink: '/all-listings',
  isActive: true
});

export function AdminHeroManagement() {
  const { m } = useI18n();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [slides, setSlides] = useState<HeroSlideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HeroSlideForm>(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<HeroPlatformFilter>('ALL');

  const loadSlides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = platformFilter === 'ALL' ? undefined : { platform: platformFilter };
      const response = await adminApi().get<{ data: HeroSlideRecord[] }>('/admin/hero-slides', { params });
      setSlides(
        response.data.data.map((slide) => ({
          ...slide,
          platform: normalizePlatform(slide.platform)
        }))
      );
    } catch {
      setError(m.admin.heroLoadError);
    } finally {
      setLoading(false);
    }
  }, [m.admin.heroLoadError, platformFilter]);

  useEffect(() => {
    void loadSlides();
  }, [loadSlides]);

  const scrollToForm = () => {
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openCreate = () => {
    setEditingId(null);
    const filteredSlides = platformFilter === 'ALL' ? slides : slides.filter((slide) => slide.platform === platformFilter);
    setForm({
      ...emptyForm(),
      platform: platformFilter === 'ALL' ? 'WEB' : platformFilter,
      sortOrder: filteredSlides.length > 0 ? Math.max(...filteredSlides.map((s) => s.sortOrder)) + 1 : 0
    });
    setShowForm(true);
    scrollToForm();
  };

  const openEdit = (slide: HeroSlideRecord) => {
    setEditingId(slide.id);
    setForm({
      sortOrder: slide.sortOrder,
      platform: normalizePlatform(slide.platform),
      imageUrl: slide.imageUrl,
      titleAr: slide.titleAr,
      titleEn: slide.titleEn,
      subtitleAr: slide.subtitleAr,
      subtitleEn: slide.subtitleEn,
      buttonLabelAr: slide.buttonLabelAr,
      buttonLabelEn: slide.buttonLabelEn,
      buttonLink: slide.buttonLink,
      isActive: slide.isActive
    });
    setShowForm(true);
    scrollToForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const updateField = <K extends keyof HeroSlideForm>(key: K, value: HeroSlideForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await adminApi().patch(`/admin/hero-slides/${editingId}`, form);
      } else {
        await adminApi().post('/admin/hero-slides', form);
      }
      closeForm();
      await loadSlides();
    } catch {
      setError(m.admin.heroSaveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(m.admin.heroDeleteConfirm)) return;
    setError(null);
    try {
      await adminApi().delete(`/admin/hero-slides/${id}`);
      if (editingId === id) closeForm();
      await loadSlides();
    } catch {
      setError(m.admin.heroDeleteError);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{m.admin.heroManagement}</h2>
          <p className="mt-1 text-sm text-slate-500">{m.admin.heroManagementHint}</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700">
          <Plus size={18} />
          {m.admin.createHeroSlide}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPlatformFilter('ALL')}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            platformFilter === 'ALL' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {m.admin.heroFilterAll}
        </button>
        <button
          type="button"
          onClick={() => setPlatformFilter('WEB')}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            platformFilter === 'WEB' ? 'bg-sky-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {m.admin.heroPlatformWeb}
        </button>
        <button
          type="button"
          onClick={() => setPlatformFilter('MOBILE')}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            platformFilter === 'MOBILE' ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {m.admin.heroPlatformMobile}
        </button>
      </div>
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
      {showForm ? (
        <form ref={formRef} onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">{editingId ? m.admin.updateHeroSlide : m.admin.createHeroSlide}</h3>
            <button type="button" onClick={closeForm} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.heroPlatform}</span>
              <select
                value={form.platform}
                onChange={(e) => updateField('platform', e.target.value as HeroSlidePlatform)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="WEB">{m.admin.heroPlatformWeb}</option>
                <option value="MOBILE">{m.admin.heroPlatformMobile}</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">{m.admin.heroPlatformHint}</p>
            </label>
            <label className="block md:col-span-2"><span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.heroImageUrl}</span><input required value={form.imageUrl} onChange={(e) => updateField('imageUrl', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
            {form.imageUrl && form.platform === 'WEB' ? <div className="md:col-span-2 overflow-hidden rounded-xl border border-slate-200"><img src={form.imageUrl} alt="" className="h-40 w-full object-cover" /></div> : null}
            {form.platform === 'MOBILE' ? (
              <AdminHeroMobilePreview
                imageUrl={form.imageUrl}
                titleAr={form.titleAr}
                titleEn={form.titleEn}
                subtitleAr={form.subtitleAr}
                subtitleEn={form.subtitleEn}
                buttonLabelAr={form.buttonLabelAr}
                buttonLabelEn={form.buttonLabelEn}
              />
            ) : null}
            <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.nameAr}</span><input required value={form.titleAr} onChange={(e) => updateField('titleAr', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.nameEn}</span><input required value={form.titleEn} onChange={(e) => updateField('titleEn', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="block md:col-span-2"><span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.heroSubtitleAr}</span><textarea required rows={2} value={form.subtitleAr} onChange={(e) => updateField('subtitleAr', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="block md:col-span-2"><span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.heroSubtitleEn}</span><textarea required rows={2} value={form.subtitleEn} onChange={(e) => updateField('subtitleEn', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.heroButtonAr}</span><input required value={form.buttonLabelAr} onChange={(e) => updateField('buttonLabelAr', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.heroButtonEn}</span><input required value={form.buttonLabelEn} onChange={(e) => updateField('buttonLabelEn', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="block md:col-span-2"><span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.heroButtonLink}</span><input required value={form.buttonLink} onChange={(e) => updateField('buttonLink', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" dir="ltr" /><p className="mt-1 text-xs text-slate-500">{m.admin.heroButtonLinkHint}</p></label>
            <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.sortOrder}</span><input type="number" min={0} value={form.sortOrder} onChange={(e) => updateField('sortOrder', Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="flex items-center gap-2 self-end pb-2"><input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} className="h-4 w-4" /><span className="text-sm font-bold text-slate-700">{m.admin.isActive}</span></label>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? m.admin.heroSaving : editingId ? m.admin.updateHeroSlide : m.admin.createHeroSlide}</button>
            <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700">{m.admin.cancel}</button>
          </div>
        </form>
      ) : null}
      {loading ? <p className="text-sm text-slate-500">{m.admin.loading}</p> : slides.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          {platformFilter === 'MOBILE' ? m.admin.heroEmptyMobile : platformFilter === 'WEB' ? m.admin.heroEmptyWeb : m.admin.heroEmpty}
        </p>
      ) : (
        <div className="grid gap-4">
          {slides.map((slide) => (
            <article key={slide.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
              <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 md:h-24 md:w-40">{slide.imageUrl ? <img src={slide.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon size={28} /></div>}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-black text-slate-900">{slide.titleAr}</p><p className="text-sm text-slate-500">{slide.titleEn}</p></div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${normalizePlatform(slide.platform) === 'MOBILE' ? 'bg-violet-100 text-violet-800' : 'bg-sky-100 text-sky-800'}`}>{normalizePlatform(slide.platform) === 'MOBILE' ? m.admin.heroPlatformMobile : m.admin.heroPlatformWeb}</span><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${slide.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{slide.isActive ? m.admin.active : m.admin.inactive}</span></div></div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{slide.subtitleAr}</p>
                <p className="mt-1 text-xs text-slate-500" dir="ltr">{slide.buttonLink} · #{slide.sortOrder}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => openEdit(slide)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Edit3 size={18} /></button>
                <button type="button" onClick={() => void handleDelete(slide.id)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"><Trash2 size={18} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}