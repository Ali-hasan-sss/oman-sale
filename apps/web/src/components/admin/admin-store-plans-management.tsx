'use client';

import { Check, Coins, Edit3, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

import { AdminStorePlansSkeleton } from '@/components/admin/admin-store-plans-skeleton';
import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';
import { type StoreBillingPeriod } from '@/lib/store-billing-period';

const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500';

type StorePlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  sortOrder: number;
  trialDays: number;
  trialMaxListings: number;
  promotionPlanId?: string | null;
  promotionPlan?: {
    id: string;
    nameAr: string;
    nameEn: string;
    badgeLabel?: string | null;
  } | null;
  isActive: boolean;
  isAdminFree: boolean;
};

type StorePlanDetail = StorePlan & {
  pricing: Array<{
    billingPeriod: StoreBillingPeriod;
    price: string | number;
    maxListings: number;
  }>;
};

type PromotionPlanOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  badgeLabel?: string | null;
  isActive: boolean;
};

type PlanFormState = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  sortOrder: string;
  trialDays: string;
  trialMaxListings: string;
  promotionPlanId: string;
  isActive: boolean;
  isAdminFree: boolean;
  oneMonthPrice: string;
  oneMonthMaxListings: string;
  twoMonthsPrice: string;
  twoMonthsMaxListings: string;
  threeMonthsPrice: string;
  threeMonthsMaxListings: string;
};

const initialPlanForm: PlanFormState = {
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  sortOrder: '0',
  trialDays: '0',
  trialMaxListings: '0',
  promotionPlanId: '',
  isActive: true,
  isAdminFree: false,
  oneMonthPrice: '0',
  oneMonthMaxListings: '10',
  twoMonthsPrice: '0',
  twoMonthsMaxListings: '20',
  threeMonthsPrice: '0',
  threeMonthsMaxListings: '30'
};

function featureLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function pricingDefaultsFromPlan(
  plan: StorePlanDetail
): Pick<
  PlanFormState,
  | 'oneMonthPrice'
  | 'oneMonthMaxListings'
  | 'twoMonthsPrice'
  | 'twoMonthsMaxListings'
  | 'threeMonthsPrice'
  | 'threeMonthsMaxListings'
> {
  const oneMonth = plan.pricing.find((row) => row.billingPeriod === 'ONE_MONTH');
  const twoMonths = plan.pricing.find((row) => row.billingPeriod === 'TWO_MONTHS');
  const threeMonths = plan.pricing.find((row) => row.billingPeriod === 'THREE_MONTHS');

  return {
    oneMonthPrice: String(oneMonth?.price ?? 0),
    oneMonthMaxListings: String(oneMonth?.maxListings ?? 10),
    twoMonthsPrice: String(twoMonths?.price ?? 0),
    twoMonthsMaxListings: String(twoMonths?.maxListings ?? 20),
    threeMonthsPrice: String(threeMonths?.price ?? 0),
    threeMonthsMaxListings: String(threeMonths?.maxListings ?? 30)
  };
}

export function AdminStorePlansManagement() {
  const { locale, localizedPath, m } = useI18n();
  const labels = m.adminStorePlans;
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [promotionPlans, setPromotionPlans] = useState<PromotionPlanOption[]>([]);
  const [form, setForm] = useState<PlanFormState>(initialPlanForm);
  const [editingId, setEditingId] = useState<string>();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StorePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [error, setError] = useState<string>();

  const loadData = async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const [plansRes, promotionPlansRes] = await Promise.all([
        adminApi().get<{ data: StorePlan[] }>('/store-plans', {
          params: { includeInactive: true, includePricing: false }
        }),
        adminApi().get<{ data: PromotionPlanOption[] }>('/promotions/plans', { params: { includeInactive: true } })
      ]);
      setPlans(plansRes.data.data);
      setPromotionPlans(promotionPlansRes.data.data);
    } catch {
      setError(labels.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const closeFormModal = () => {
    setForm(initialPlanForm);
    setEditingId(undefined);
    setFormModalOpen(false);
  };

  const startAdd = () => {
    setForm(initialPlanForm);
    setEditingId(undefined);
    setFormModalOpen(true);
  };

  const startEdit = async (plan: StorePlan) => {
    try {
      const response = await adminApi().get<{ data: StorePlanDetail }>(`/store-plans/${plan.id}`);
      const detail = response.data.data;
      const pricingDefaults = pricingDefaultsFromPlan(detail);

      setEditingId(plan.id);
      setForm({
        nameAr: detail.nameAr,
        nameEn: detail.nameEn,
        descriptionAr: detail.descriptionAr,
        descriptionEn: detail.descriptionEn,
        sortOrder: String(detail.sortOrder),
        trialDays: String(detail.trialDays ?? 0),
        trialMaxListings: String(detail.trialMaxListings ?? 0),
        promotionPlanId: detail.promotionPlanId ?? '',
        isActive: detail.isActive,
        isAdminFree: detail.isAdminFree ?? false,
        ...pricingDefaults
      });
      setFormModalOpen(true);
    } catch {
      setError(labels.loadError);
    }
  };

  const submitPlan = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        descriptionAr: form.descriptionAr.trim(),
        descriptionEn: form.descriptionEn.trim(),
        sortOrder: Number(form.sortOrder),
        trialDays: Number(form.trialDays),
        trialMaxListings: Number(form.trialMaxListings),
        promotionPlanId: form.promotionPlanId || null,
        isActive: form.isActive,
        isAdminFree: form.isAdminFree,
        oneMonthPrice: Number(form.oneMonthPrice),
        oneMonthMaxListings: Number(form.oneMonthMaxListings),
        twoMonthsPrice: Number(form.twoMonthsPrice),
        twoMonthsMaxListings: Number(form.twoMonthsMaxListings),
        threeMonthsPrice: Number(form.threeMonthsPrice),
        threeMonthsMaxListings: Number(form.threeMonthsMaxListings)
      };

      if (editingId) {
        await adminApi().patch(`/store-plans/${editingId}`, payload);
      } else {
        await adminApi().post('/store-plans', payload);
      }

      closeFormModal();
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeletePlan = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(undefined);

    try {
      await adminApi().delete(`/store-plans/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadData();
    } catch {
      setDeleteError(labels.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">{labels.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{labels.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700"
          >
            <Plus size={18} />
            {labels.createPlan}
          </button>
        </div>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-black">{labels.plansList}</h3>
        {isLoading ? (
          <AdminStorePlansSkeleton />
        ) : plans.length === 0 ? (
          <p className="rounded-3xl bg-white p-6 text-slate-500 shadow-sm">{labels.empty}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const features = featureLines(locale === 'en' ? plan.descriptionEn : plan.descriptionAr);

              return (
                <article key={plan.id} className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex min-h-[9.5rem] flex-col bg-gradient-to-br from-brand-600 to-emerald-700 px-6 py-5 text-white">
                    <div className="flex flex-1 items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xl font-black">{locale === 'en' ? plan.nameEn : plan.nameAr}</h4>
                        <div className="mt-2 flex min-h-[3.5rem] flex-wrap content-start gap-2 text-xs font-bold">
                          {plan.isActive ? (
                            <span className="rounded-full bg-white/20 px-2 py-1">{labels.active}</span>
                          ) : (
                            <span className="rounded-full bg-black/20 px-2 py-1">{labels.inactive}</span>
                          )}
                          {plan.isAdminFree ? (
                            <span className="rounded-full bg-emerald-300/90 px-2 py-1 text-emerald-950">{labels.adminFreeBadge}</span>
                          ) : null}
                          {plan.trialDays > 0 ? (
                            <span className="rounded-full bg-amber-300/90 px-2 py-1 text-amber-950">
                              {labels.trialDays}: {plan.trialDays}
                              {plan.trialMaxListings > 0 ? ` • ${labels.trialMaxListings}: ${plan.trialMaxListings}` : ''}
                            </span>
                          ) : null}
                          {plan.promotionPlan ? (
                            <span className="rounded-full bg-white/20 px-2 py-1">
                              {labels.promotionPlan}: {locale === 'en' ? plan.promotionPlan.nameEn : plan.promotionPlan.nameAr}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => startEdit(plan)} className="rounded-lg bg-white/15 p-2 hover:bg-white/25">
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(undefined);
                            setDeleteTarget(plan);
                          }}
                          className="rounded-lg bg-red-500/20 p-2 hover:bg-red-500/30"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    {features.length > 0 ? (
                      <ul className="mb-4 flex-1 space-y-2">
                        {features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                            <Check size={16} className="mt-0.5 shrink-0 text-brand-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mb-4 flex-1" />
                    )}

                    <Link
                      href={localizedPath(`/admin/store-plans/${plan.id}/pricing`)}
                      className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
                    >
                      <Coins size={16} />
                      {labels.managePricing}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">{labels.deleteTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">{labels.deleteConfirm}</p>
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
                {isDeleting ? labels.loading : labels.deletePlan}
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
                {labels.cancel}
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
                {editingId ? labels.updatePlan : labels.createPlan}
              </h3>
              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-full p-2 transition hover:bg-slate-100"
                aria-label={labels.cancel}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitPlan} className="grid gap-4 lg:grid-cols-2">
              <Field label={labels.nameAr}>
                <input className={inputClass} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
              </Field>
              <Field label={labels.nameEn}>
                <input className={inputClass} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
              </Field>
              <Field label={labels.descriptionAr}>
                <textarea className={`${inputClass} min-h-28`} value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} required />
              </Field>
              <Field label={labels.descriptionEn}>
                <textarea className={`${inputClass} min-h-28`} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} required />
              </Field>
              <Field label={labels.sortOrder}>
                <input className={inputClass} type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </Field>
              <Field label={labels.trialDays}>
                <input className={inputClass} type="number" min={0} max={365} value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} />
                <span className="mt-1 block text-xs text-slate-500">{labels.trialDaysHint}</span>
              </Field>
              {Number(form.trialDays) > 0 ? (
                <Field label={labels.trialMaxListings}>
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    value={form.trialMaxListings}
                    onChange={(e) => setForm({ ...form, trialMaxListings: e.target.value })}
                    required
                  />
                  <span className="mt-1 block text-xs text-slate-500">{labels.trialMaxListingsHint}</span>
                </Field>
              ) : null}
              <Field label={labels.promotionPlan}>
                <select
                  className={inputClass}
                  value={form.promotionPlanId}
                  onChange={(e) => setForm({ ...form, promotionPlanId: e.target.value })}
                >
                  <option value="">{labels.noPromotionPlan}</option>
                  {promotionPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {locale === 'en' ? plan.nameEn : plan.nameAr}
                      {plan.badgeLabel ? ` (${plan.badgeLabel})` : ''}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-slate-500">{labels.promotionPlanHint}</span>
              </Field>
              <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                {labels.active}
              </label>
              <label className="flex flex-col gap-1 self-end pb-3 text-sm font-bold text-slate-700 lg:col-span-2">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isAdminFree}
                    onChange={(e) => setForm({ ...form, isAdminFree: e.target.checked })}
                  />
                  {labels.isAdminFree}
                </span>
                <span className="text-xs font-normal text-slate-500">{labels.isAdminFreeHint}</span>
              </label>

              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-sm font-black text-slate-800">{labels.defaultPricingTitle}</p>
                <p className="mb-4 text-xs text-slate-500">{labels.defaultPricingHint}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={labels.oneMonthPrice}>
                    <input className={inputClass} type="number" min={0} step="0.001" value={form.oneMonthPrice} onChange={(e) => setForm({ ...form, oneMonthPrice: e.target.value })} required />
                  </Field>
                  <Field label={labels.oneMonthMaxListings}>
                    <input className={inputClass} type="number" min={1} value={form.oneMonthMaxListings} onChange={(e) => setForm({ ...form, oneMonthMaxListings: e.target.value })} required />
                  </Field>
                  <Field label={labels.twoMonthsPrice}>
                    <input className={inputClass} type="number" min={0} step="0.001" value={form.twoMonthsPrice} onChange={(e) => setForm({ ...form, twoMonthsPrice: e.target.value })} required />
                  </Field>
                  <Field label={labels.twoMonthsMaxListings}>
                    <input className={inputClass} type="number" min={1} value={form.twoMonthsMaxListings} onChange={(e) => setForm({ ...form, twoMonthsMaxListings: e.target.value })} required />
                  </Field>
                  <Field label={labels.threeMonthsPrice}>
                    <input className={inputClass} type="number" min={0} step="0.001" value={form.threeMonthsPrice} onChange={(e) => setForm({ ...form, threeMonthsPrice: e.target.value })} required />
                  </Field>
                  <Field label={labels.threeMonthsMaxListings}>
                    <input className={inputClass} type="number" min={1} value={form.threeMonthsMaxListings} onChange={(e) => setForm({ ...form, threeMonthsMaxListings: e.target.value })} required />
                  </Field>
                </div>
              </div>

              <div className="flex gap-3 lg:col-span-2">
                <button type="submit" disabled={isSaving} className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                  {editingId ? labels.updatePlan : labels.createPlan}
                </button>
                <button type="button" onClick={closeFormModal} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">
                  {labels.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
