'use client';

import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type TourismDestination = {
  id: string;
  slug: string;
  sortOrder: number;
  imageUrl: string;
  titleAr: string;
  titleEn: string;
  rating: string;
  ratingLabelAr: string;
  ratingLabelEn: string;
  aboutAr: string;
  aboutEn: string;
  highlightsAr: string[];
  highlightsEn: string[];
  activitiesAr: string[];
  activitiesEn: string[];
  bestTimeAr: string;
  bestTimeEn: string;
  addressAr: string;
  addressEn: string;
  isActive: boolean;
};

type TourismForm = Omit<TourismDestination, 'id' | 'highlightsAr' | 'highlightsEn' | 'activitiesAr' | 'activitiesEn'> & {
  highlightsAr: string;
  highlightsEn: string;
  activitiesAr: string;
  activitiesEn: string;
};

const emptyForm: TourismForm = {
  slug: '',
  sortOrder: 0,
  imageUrl: '',
  titleAr: '',
  titleEn: '',
  rating: '4.9',
  ratingLabelAr: 'تقييم ممتاز',
  ratingLabelEn: 'Excellent rating',
  aboutAr: '',
  aboutEn: '',
  highlightsAr: '',
  highlightsEn: '',
  activitiesAr: '',
  activitiesEn: '',
  bestTimeAr: '',
  bestTimeEn: '',
  addressAr: '',
  addressEn: '',
  isActive: true
};

const lines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);
const join = (value: string[]) => value.join('\n');

export function AdminTourismManagement() {
  const { locale, m } = useI18n();
  const [items, setItems] = useState<TourismDestination[]>([]);
  const [form, setForm] = useState<TourismForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);

  const scrollToForm = () => {
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi().get<{ data: TourismDestination[] }>('/admin/tourism-destinations', {
        params: { includeInactive: true }
      });
      setItems(response.data.data);
    } catch {
      setError(m.admin.tourismLoadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: items.length });
    setShowForm(true);
    scrollToForm();
  };

  const openEdit = (item: TourismDestination) => {
    setEditingId(item.id);
    setForm({
      ...item,
      highlightsAr: join(item.highlightsAr),
      highlightsEn: join(item.highlightsEn),
      activitiesAr: join(item.activitiesAr),
      activitiesEn: join(item.activitiesEn)
    });
    setShowForm(true);
    scrollToForm();
  };

  const payload = () => ({
    ...form,
    highlightsAr: lines(form.highlightsAr),
    highlightsEn: lines(form.highlightsEn),
    activitiesAr: lines(form.activitiesAr),
    activitiesEn: lines(form.activitiesEn)
  });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (editingId) await adminApi().patch(`/admin/tourism-destinations/${editingId}`, payload());
      else await adminApi().post('/admin/tourism-destinations', payload());
      setShowForm(false);
      setEditingId(null);
      await load();
    } catch {
      setError(m.admin.tourismSaveError);
    }
  };

  const remove = async (item: TourismDestination) => {
    if (!window.confirm(m.admin.tourismDeleteConfirm)) return;
    await adminApi().delete(`/admin/tourism-destinations/${item.id}`);
    await load();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{m.admin.tourismManagement}</h2>
            <p className="mt-1 text-sm text-slate-500">{m.admin.tourismManagementHint}</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white">
            <Plus size={18} />
            {m.admin.createTourismDestination}
          </button>
        </div>

        {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

        {showForm ? (
          <form ref={formRef} onSubmit={save} className="scroll-mt-24 mb-6 rounded-2xl border border-slate-200 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black">{editingId ? m.admin.updateTourismDestination : m.admin.createTourismDestination}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Slug" value={form.slug} onChange={(slug) => setForm({ ...form, slug })} />
              <Input label={m.admin.sortOrder} type="number" value={String(form.sortOrder)} onChange={(sortOrder) => setForm({ ...form, sortOrder: Number(sortOrder) })} />
              <Input label={m.admin.heroImageUrl} value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} wide />
              <Input label={m.admin.nameAr} value={form.titleAr} onChange={(titleAr) => setForm({ ...form, titleAr })} />
              <Input label={m.admin.nameEn} value={form.titleEn} onChange={(titleEn) => setForm({ ...form, titleEn })} />
              <Input label={m.admin.rating} value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
              <Input label={m.admin.ratingLabelAr} value={form.ratingLabelAr} onChange={(ratingLabelAr) => setForm({ ...form, ratingLabelAr })} />
              <Input label={m.admin.ratingLabelEn} value={form.ratingLabelEn} onChange={(ratingLabelEn) => setForm({ ...form, ratingLabelEn })} />
              <Textarea label={m.admin.aboutAr} value={form.aboutAr} onChange={(aboutAr) => setForm({ ...form, aboutAr })} />
              <Textarea label={m.admin.aboutEn} value={form.aboutEn} onChange={(aboutEn) => setForm({ ...form, aboutEn })} />
              <Textarea label={m.admin.highlightsAr} value={form.highlightsAr} onChange={(highlightsAr) => setForm({ ...form, highlightsAr })} />
              <Textarea label={m.admin.highlightsEn} value={form.highlightsEn} onChange={(highlightsEn) => setForm({ ...form, highlightsEn })} />
              <Textarea label={m.admin.activitiesAr} value={form.activitiesAr} onChange={(activitiesAr) => setForm({ ...form, activitiesAr })} />
              <Textarea label={m.admin.activitiesEn} value={form.activitiesEn} onChange={(activitiesEn) => setForm({ ...form, activitiesEn })} />
              <Input label={m.admin.bestTimeAr} value={form.bestTimeAr} onChange={(bestTimeAr) => setForm({ ...form, bestTimeAr })} />
              <Input label={m.admin.bestTimeEn} value={form.bestTimeEn} onChange={(bestTimeEn) => setForm({ ...form, bestTimeEn })} />
              <Input label={m.admin.addressAr} value={form.addressAr} onChange={(addressAr) => setForm({ ...form, addressAr })} />
              <Input label={m.admin.addressEn} value={form.addressEn} onChange={(addressEn) => setForm({ ...form, addressEn })} />
              <label className="flex items-center gap-2 font-bold text-slate-700">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                {m.admin.isActive}
              </label>
            </div>
            <button className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white">{m.admin.save}</button>
          </form>
        ) : null}

        {loading ? (
          <p className="text-slate-500">{m.admin.loading}</p>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row">
                <img src={item.imageUrl} alt={item.titleAr} className="h-28 w-full rounded-xl object-cover md:w-44" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-slate-900">{locale === 'en' ? item.titleEn : item.titleAr}</h3>
                  <p className="mt-1 text-xs text-slate-500" dir="ltr">/{item.slug}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{locale === 'en' ? item.aboutEn : item.aboutAr}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-600"><Edit3 size={18} /></button>
                  <button onClick={() => void remove(item)} className="rounded-lg border border-red-200 p-2 text-red-600"><Trash2 size={18} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Input({ label, onChange, type = 'text', value, wide = false }: { label: string; onChange: (value: string) => void; type?: string; value: string; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'md:col-span-2' : ''}`}>
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <input value={value} type={type} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
    </label>
  );
}

function Textarea({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <span className="text-xs text-slate-400">كل عنصر في سطر مستقل</span>
    </label>
  );
}
