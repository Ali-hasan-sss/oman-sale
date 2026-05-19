'use client';

import { Edit3, Plus, Trash2 } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500';

type PromotionPlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  weekPrice: string | number;
  twoWeeksPrice: string | number;
  monthPrice: string | number;
  priorityScore: number;
  dailyImpressions: number;
  appearsFirst: boolean;
  badgeLabel?: string | null;
  color?: string | null;
  isActive: boolean;
};

type PromotionFormState = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  weekPrice: string;
  twoWeeksPrice: string;
  monthPrice: string;
  priorityScore: string;
  dailyImpressions: string;
  appearsFirst: boolean;
  badgeLabel: string;
  color: string;
  isActive: boolean;
};

type PromotionFormErrors = Partial<Record<keyof PromotionFormState, string>>;

const initialForm: PromotionFormState = {
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  weekPrice: '0',
  twoWeeksPrice: '0',
  monthPrice: '0',
  priorityScore: '0',
  dailyImpressions: '1',
  appearsFirst: false,
  badgeLabel: '',
  color: '#0f766e',
  isActive: true
};

export function AdminPromotionsManagement() {
  const { m } = useI18n();
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [form, setForm] = useState<PromotionFormState>(initialForm);
  const [formErrors, setFormErrors] = useState<PromotionFormErrors>({});
  const [editingId, setEditingId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const loadPlans = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await adminApi().get<{ data: PromotionPlan[] }>('/promotions/plans', {
        params: { includeInactive: true }
      });
      setPlans(response.data.data);
    } catch {
      setError(m.admin.promotionsLoadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [m.admin.promotionsLoadError]);

  const validateForm = () => {
    const nextErrors: PromotionFormErrors = {};
    const isPriceValid = (value: string) => Number.isFinite(Number(value)) && Number(value) >= 0;

    if (form.nameAr.trim().length < 2) nextErrors.nameAr = m.admin.requiredField;
    if (form.nameEn.trim().length < 2) nextErrors.nameEn = m.admin.requiredField;
    if (form.descriptionAr.trim().length < 2) nextErrors.descriptionAr = m.admin.requiredField;
    if (form.descriptionEn.trim().length < 2) nextErrors.descriptionEn = m.admin.requiredField;
    if (!isPriceValid(form.weekPrice)) nextErrors.weekPrice = m.admin.requiredField;
    if (!isPriceValid(form.twoWeeksPrice)) nextErrors.twoWeeksPrice = m.admin.requiredField;
    if (!isPriceValid(form.monthPrice)) nextErrors.monthPrice = m.admin.requiredField;
    if (!Number.isInteger(Number(form.priorityScore)) || Number(form.priorityScore) < 0) nextErrors.priorityScore = m.admin.requiredField;
    if (!Number.isInteger(Number(form.dailyImpressions)) || Number(form.dailyImpressions) < 1) nextErrors.dailyImpressions = m.admin.requiredField;

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForm(initialForm);
    setFormErrors({});
    setEditingId(undefined);
  };

  const startEdit = (plan: PromotionPlan) => {
    setEditingId(plan.id);
    setForm({
      nameAr: plan.nameAr,
      nameEn: plan.nameEn,
      descriptionAr: plan.descriptionAr,
      descriptionEn: plan.descriptionEn,
      weekPrice: String(plan.weekPrice),
      twoWeeksPrice: String(plan.twoWeeksPrice),
      monthPrice: String(plan.monthPrice),
      priorityScore: String(plan.priorityScore),
      dailyImpressions: String(plan.dailyImpressions),
      appearsFirst: plan.appearsFirst,
      badgeLabel: plan.badgeLabel ?? '',
      color: plan.color ?? '#0f766e',
      isActive: plan.isActive
    });
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);

    const payload = {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      descriptionAr: form.descriptionAr.trim(),
      descriptionEn: form.descriptionEn.trim(),
      weekPrice: Number(form.weekPrice),
      twoWeeksPrice: Number(form.twoWeeksPrice),
      monthPrice: Number(form.monthPrice),
      priorityScore: Number(form.priorityScore),
      dailyImpressions: Number(form.dailyImpressions),
      appearsFirst: form.appearsFirst,
      badgeLabel: form.badgeLabel || undefined,
      color: form.color || undefined,
      isActive: form.isActive
    };

    try {
      if (editingId) {
        await adminApi().patch(`/promotions/plans/${editingId}`, payload);
      } else {
        await adminApi().post('/promotions/plans', payload);
      }

      resetForm();
      await loadPlans();
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlan = async (planId: string) => {
    await adminApi().delete(`/promotions/plans/${planId}`);
    await loadPlans();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-black">{m.admin.promotionsManagement}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {plans.length} {m.admin.totalResults}
          </p>
        </div>

        {error ? <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

        <form onSubmit={submit} className="mb-8 grid gap-4 rounded-2xl bg-slate-50 p-4 lg:grid-cols-3">
          <Field label={m.admin.promotionNameAr} error={formErrors.nameAr}>
            <input value={form.nameAr} onChange={(event) => setForm((current) => ({ ...current, nameAr: event.target.value }))} className={inputClass} />
          </Field>
          <Field label={m.admin.promotionNameEn} error={formErrors.nameEn}>
            <input dir="ltr" value={form.nameEn} onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))} className={inputClass} />
          </Field>
          <Field label={m.admin.badgeLabel}>
            <input value={form.badgeLabel} onChange={(event) => setForm((current) => ({ ...current, badgeLabel: event.target.value }))} className={inputClass} />
          </Field>
          <Field label={m.admin.promotionDescriptionAr} error={formErrors.descriptionAr}>
            <textarea value={form.descriptionAr} onChange={(event) => setForm((current) => ({ ...current, descriptionAr: event.target.value }))} className={`${inputClass} min-h-24`} />
          </Field>
          <Field label={m.admin.promotionDescriptionEn} error={formErrors.descriptionEn}>
            <textarea dir="ltr" value={form.descriptionEn} onChange={(event) => setForm((current) => ({ ...current, descriptionEn: event.target.value }))} className={`${inputClass} min-h-24`} />
          </Field>
          <Field label={m.admin.color}>
            <input type="color" value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-2" />
          </Field>
          <Field label={m.admin.weekPrice} error={formErrors.weekPrice} hint={m.admin.freePriceHint}>
            <input type="number" min="0" step="0.001" value={form.weekPrice} onChange={(event) => setForm((current) => ({ ...current, weekPrice: event.target.value }))} className={inputClass} />
          </Field>
          <Field label={m.admin.twoWeeksPrice} error={formErrors.twoWeeksPrice} hint={m.admin.freePriceHint}>
            <input type="number" min="0" step="0.001" value={form.twoWeeksPrice} onChange={(event) => setForm((current) => ({ ...current, twoWeeksPrice: event.target.value }))} className={inputClass} />
          </Field>
          <Field label={m.admin.monthPrice} error={formErrors.monthPrice} hint={m.admin.freePriceHint}>
            <input type="number" min="0" step="0.001" value={form.monthPrice} onChange={(event) => setForm((current) => ({ ...current, monthPrice: event.target.value }))} className={inputClass} />
          </Field>
          <Field label={m.admin.priorityScore} error={formErrors.priorityScore}>
            <input type="number" min="0" value={form.priorityScore} onChange={(event) => setForm((current) => ({ ...current, priorityScore: event.target.value }))} className={inputClass} />
          </Field>
          <Field label={m.admin.dailyImpressions} error={formErrors.dailyImpressions}>
            <input type="number" min="1" value={form.dailyImpressions} onChange={(event) => setForm((current) => ({ ...current, dailyImpressions: event.target.value }))} className={inputClass} />
          </Field>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.appearsFirst} onChange={(event) => setForm((current) => ({ ...current, appearsFirst: event.target.checked }))} />
              {m.admin.appearsFirst}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
              {m.admin.isActive}
            </label>
          </div>
          <div className="flex gap-3 lg:col-span-3">
            <button disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">
              <Plus size={18} />
              {editingId ? m.admin.updatePromotion : m.admin.createPromotion}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">
                {m.admin.cancel}
              </button>
            ) : null}
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">{m.admin.promotionNameAr}</th>
                <th className="px-4 py-3 text-start">{m.admin.weekPrice}</th>
                <th className="px-4 py-3 text-start">{m.admin.twoWeeksPrice}</th>
                <th className="px-4 py-3 text-start">{m.admin.monthPrice}</th>
                <th className="px-4 py-3 text-start">{m.admin.status}</th>
                <th className="px-4 py-3 text-start">{m.admin.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-bold text-slate-500">
                    {m.admin.loading}
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const color = plan.color || '#f8fafc';

                  return (
                    <tr key={plan.id} style={{ backgroundColor: `${color}18` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-2 rounded-full" style={{ backgroundColor: color }} />
                          <div>
                            <div className="font-bold">{plan.nameAr}</div>
                            <div className="text-xs text-slate-500">{plan.nameEn}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatPrice(plan.weekPrice)}</td>
                      <td className="px-4 py-3">{formatPrice(plan.twoWeeksPrice)}</td>
                      <td className="px-4 py-3">{formatPrice(plan.monthPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${plan.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {plan.isActive ? m.admin.active : m.admin.inactive}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => startEdit(plan)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 font-bold text-slate-700 transition hover:bg-white">
                            <Edit3 size={14} />
                            {m.admin.editPromotion}
                          </button>
                          <button onClick={() => deletePlan(plan.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white/80 px-3 py-2 font-bold text-red-600 transition hover:bg-red-50">
                            <Trash2 size={14} />
                            {m.admin.deletePromotion}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ children, error, hint, label }: { children: ReactNode; error?: string; hint?: string; label: string }) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-bold text-slate-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
      {error ? <span className="block text-xs font-bold text-red-600">{error}</span> : null}
    </div>
  );
}

function formatPrice(value: string | number) {
  const numericValue = Number(value);
  return numericValue === 0 ? '0' : numericValue.toFixed(3);
}
