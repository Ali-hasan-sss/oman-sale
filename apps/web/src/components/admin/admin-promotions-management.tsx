'use client';

import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useState } from 'react';

import { AdminTableSkeleton } from '@/components/admin/admin-table-skeleton';
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
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromotionPlan | null>(null);
  const [deleteError, setDeleteError] = useState<string>();
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

  const closeFormModal = () => {
    setForm(initialForm);
    setFormErrors({});
    setEditingId(undefined);
    setFormModalOpen(false);
  };

  const startAdd = () => {
    setForm(initialForm);
    setFormErrors({});
    setEditingId(undefined);
    setFormModalOpen(true);
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
    setFormModalOpen(true);
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

      closeFormModal();
      await loadPlans();
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeletePlan = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(undefined);

    try {
      await adminApi().delete(`/promotions/plans/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadPlans();
    } catch {
      setDeleteError(m.admin.promotionsDeleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">{m.admin.promotionsManagement}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {plans.length} {m.admin.totalResults}
            </p>
          </div>
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700"
          >
            <Plus size={18} />
            {m.admin.createPromotion}
          </button>
        </div>

        {error ? <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

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
                <AdminTableSkeleton
                  asBodyOnly
                  rows={6}
                  columnTypes={['avatar-text', 'text', 'text', 'text', 'badge', 'actions']}
                />
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-bold text-slate-500">
                    {m.admin.promotionsEmpty}
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
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            plan.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {plan.isActive ? m.admin.active : m.admin.inactive}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(plan)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 font-bold text-slate-700 transition hover:bg-white"
                          >
                            <Edit3 size={14} />
                            {m.admin.editPromotion}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(undefined);
                              setDeleteTarget(plan);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white/80 px-3 py-2 font-bold text-red-600 transition hover:bg-red-50"
                          >
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

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">{m.admin.promotionsDeleteTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">{m.admin.promotionsDeleteConfirm}</p>
            <p className="mt-3 font-bold text-slate-800">{deleteTarget.nameAr}</p>
            <p className="text-sm text-slate-500">{deleteTarget.nameEn}</p>
            {deleteError ? (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{deleteError}</p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeletePlan}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? m.admin.loading : m.admin.deletePromotion}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(undefined);
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {m.admin.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {formModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-xl font-black text-slate-900">
                {editingId ? m.admin.updatePromotion : m.admin.createPromotion}
              </h3>
              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-full p-2 transition hover:bg-slate-100"
                aria-label={m.admin.cancel}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
              <Field label={m.admin.promotionNameAr} error={formErrors.nameAr}>
                <input
                  value={form.nameAr}
                  onChange={(event) => setForm((current) => ({ ...current, nameAr: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label={m.admin.promotionNameEn} error={formErrors.nameEn}>
                <input
                  dir="ltr"
                  value={form.nameEn}
                  onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label={m.admin.badgeLabel}>
                <input
                  value={form.badgeLabel}
                  onChange={(event) => setForm((current) => ({ ...current, badgeLabel: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label={m.admin.promotionDescriptionAr} error={formErrors.descriptionAr}>
                <textarea
                  value={form.descriptionAr}
                  onChange={(event) => setForm((current) => ({ ...current, descriptionAr: event.target.value }))}
                  className={`${inputClass} min-h-24`}
                />
              </Field>
              <Field label={m.admin.promotionDescriptionEn} error={formErrors.descriptionEn}>
                <textarea
                  dir="ltr"
                  value={form.descriptionEn}
                  onChange={(event) => setForm((current) => ({ ...current, descriptionEn: event.target.value }))}
                  className={`${inputClass} min-h-24`}
                />
              </Field>
              <Field label={m.admin.color}>
                <input
                  type="color"
                  value={form.color}
                  onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-2"
                />
              </Field>
              <Field label={m.admin.weekPrice} error={formErrors.weekPrice} hint={m.admin.freePriceHint}>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.weekPrice}
                  onChange={(event) => setForm((current) => ({ ...current, weekPrice: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label={m.admin.twoWeeksPrice} error={formErrors.twoWeeksPrice} hint={m.admin.freePriceHint}>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.twoWeeksPrice}
                  onChange={(event) => setForm((current) => ({ ...current, twoWeeksPrice: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label={m.admin.monthPrice} error={formErrors.monthPrice} hint={m.admin.freePriceHint}>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.monthPrice}
                  onChange={(event) => setForm((current) => ({ ...current, monthPrice: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label={m.admin.priorityScore} labelHint={m.admin.priorityScoreHint} error={formErrors.priorityScore}>
                <input
                  type="number"
                  min="0"
                  value={form.priorityScore}
                  onChange={(event) => setForm((current) => ({ ...current, priorityScore: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label={m.admin.dailyImpressions} labelHint={m.admin.dailyImpressionsHint} error={formErrors.dailyImpressions}>
                <input
                  type="number"
                  min="1"
                  value={form.dailyImpressions}
                  onChange={(event) => setForm((current) => ({ ...current, dailyImpressions: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.appearsFirst}
                    onChange={(event) => setForm((current) => ({ ...current, appearsFirst: event.target.checked }))}
                  />
                  {m.admin.appearsFirst}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  {m.admin.isActive}
                </label>
              </div>
              <div className="flex gap-3 lg:col-span-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {editingId ? m.admin.updatePromotion : m.admin.createPromotion}
                </button>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  {m.admin.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  children,
  error,
  hint,
  label,
  labelHint
}: {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
  labelHint?: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <span className="block text-sm font-bold text-slate-700">{label}</span>
        {labelHint ? <span className="mt-0.5 block text-xs font-normal text-slate-500">({labelHint})</span> : null}
      </div>
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
