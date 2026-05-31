'use client';

import { Check, Edit3, Percent, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500';

type RootCategory = {
  id: string;
  nameAr: string;
  nameEn: string;
  parentId?: string | null;
};

type StorePlanPricing = {
  id: string;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  price: string | number;
  maxListings: number;
  discountType: 'NONE' | 'FIXED' | 'PERCENTAGE';
  discountValue: string | number;
  isDiscountActive: boolean;
  finalPrice?: number;
  categoryId: string;
  category?: RootCategory;
};

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
  discountType: 'NONE' | 'FIXED' | 'PERCENTAGE';
  discountValue: string | number;
  isDiscountActive: boolean;
  pricing: StorePlanPricing[];
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
};

type PricingFormState = {
  categoryId: string;
  monthlyPrice: string;
  monthlyMaxListings: string;
  yearlyPrice: string;
  yearlyMaxListings: string;
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
  isActive: true
};

const initialPricingForm: PricingFormState = {
  categoryId: '',
  monthlyPrice: '0',
  monthlyMaxListings: '10',
  yearlyPrice: '0',
  yearlyMaxListings: '120'
};

function formatPrice(value: number) {
  return value <= 0 ? '0.000' : value.toFixed(3);
}

function featureLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AdminStorePlansManagement() {
  const { locale, m } = useI18n();
  const labels = m.adminStorePlans;
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [promotionPlans, setPromotionPlans] = useState<PromotionPlanOption[]>([]);
  const [categories, setCategories] = useState<RootCategory[]>([]);
  const [form, setForm] = useState<PlanFormState>(initialPlanForm);
  const [pricingForm, setPricingForm] = useState<PricingFormState>(initialPricingForm);
  const [editingId, setEditingId] = useState<string>();
  const [pricingPlanId, setPricingPlanId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories]
  );

  const loadData = async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const [plansRes, categoriesRes, promotionPlansRes] = await Promise.all([
        adminApi().get<{ data: StorePlan[] }>('/store-plans', { params: { includeInactive: true } }),
        adminApi().get<{ data: { items: RootCategory[] } }>('/admin/categories', { params: { all: true } }),
        adminApi().get<{ data: PromotionPlanOption[] }>('/promotions/plans', { params: { includeInactive: true } })
      ]);
      setPlans(plansRes.data.data);
      setCategories(categoriesRes.data.data.items);
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

  const resetForm = () => {
    setForm(initialPlanForm);
    setEditingId(undefined);
  };

  const startEdit = (plan: StorePlan) => {
    setEditingId(plan.id);
    setForm({
      nameAr: plan.nameAr,
      nameEn: plan.nameEn,
      descriptionAr: plan.descriptionAr,
      descriptionEn: plan.descriptionEn,
      sortOrder: String(plan.sortOrder),
      trialDays: String(plan.trialDays ?? 0),
      trialMaxListings: String(plan.trialMaxListings ?? 0),
      promotionPlanId: plan.promotionPlanId ?? '',
      isActive: plan.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        isActive: form.isActive
      };
      if (editingId) {
        await adminApi().patch(`/store-plans/${editingId}`, payload);
      } else {
        await adminApi().post('/store-plans', payload);
      }
      resetForm();
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlan = async (planId: string) => {
    await adminApi().delete(`/store-plans/${planId}`);
    await loadData();
  };

  const submitPricing = async (event: FormEvent) => {
    event.preventDefault();
    if (!pricingPlanId || !pricingForm.categoryId) return;
    setIsSaving(true);
    try {
      await adminApi().post(`/store-plans/${pricingPlanId}/pricing/bulk`, {
        categoryId: pricingForm.categoryId,
        monthlyPrice: Number(pricingForm.monthlyPrice),
        monthlyMaxListings: Number(pricingForm.monthlyMaxListings),
        yearlyPrice: Number(pricingForm.yearlyPrice),
        yearlyMaxListings: Number(pricingForm.yearlyMaxListings)
      });
      setPricingForm(initialPricingForm);
      setPricingPlanId(undefined);
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const updatePlanDiscount = async (
    planId: string,
    payload: { discountType?: string; discountValue?: number; isDiscountActive?: boolean }
  ) => {
    await adminApi().patch(`/store-plans/${planId}/discount`, payload);
    await loadData();
  };

  const updateCategoryDiscount = async (
    pricingId: string,
    payload: { discountType?: string; discountValue?: number; isDiscountActive?: boolean }
  ) => {
    await adminApi().patch(`/store-plans/pricing/${pricingId}/discount`, payload);
    await loadData();
  };

  const categoryLabel = (category?: RootCategory) =>
    locale === 'en' ? category?.nameEn || category?.nameAr : category?.nameAr || category?.nameEn;

  const groupedPricing = (plan: StorePlan) => {
    const groups = new Map<string, StorePlanPricing[]>();
    for (const row of plan.pricing) {
      const current = groups.get(row.categoryId) ?? [];
      current.push(row);
      groups.set(row.categoryId, current);
    }
    return Array.from(groups.entries()).map(([categoryId, rows]) => ({
      categoryId,
      category: rows[0]?.category,
      rows
    }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">{labels.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{labels.subtitle}</p>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

        <form onSubmit={submitPlan} className="mt-6 grid gap-4 lg:grid-cols-2">
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
          <div className="lg:col-span-2 flex gap-3">
            <button type="submit" disabled={isSaving} className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {editingId ? labels.updatePlan : labels.createPlan}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">
                {labels.cancel}
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-black">{labels.plansList}</h3>
        {isLoading ? (
          <p className="text-slate-500">{labels.loading}</p>
        ) : plans.length === 0 ? (
          <p className="rounded-3xl bg-white p-6 text-slate-500 shadow-sm">{labels.empty}</p>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {plans.map((plan) => {
              const features = featureLines(locale === 'en' ? plan.descriptionEn : plan.descriptionAr);
              const pricingGroups = groupedPricing(plan);

              return (
                <article key={plan.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-br from-brand-600 to-emerald-700 px-6 py-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xl font-black">{locale === 'en' ? plan.nameEn : plan.nameAr}</h4>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                          {plan.isActive ? (
                            <span className="rounded-full bg-white/20 px-2 py-1">{labels.active}</span>
                          ) : (
                            <span className="rounded-full bg-black/20 px-2 py-1">{labels.inactive}</span>
                          )}
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
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(plan)} className="rounded-lg bg-white/15 p-2 hover:bg-white/25">
                          <Edit3 size={16} />
                        </button>
                        <button type="button" onClick={() => deletePlan(plan.id)} className="rounded-lg bg-red-500/20 p-2 hover:bg-red-500/30">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    {features.length > 0 ? (
                      <ul className="space-y-2">
                        {features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                            <Check size={16} className="mt-0.5 shrink-0 text-brand-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                      <p className="mb-3 text-sm font-black text-brand-800">{labels.planDiscount}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          value={plan.discountType}
                          onChange={(e) =>
                            updatePlanDiscount(plan.id, {
                              discountType: e.target.value,
                              discountValue: Number(plan.discountValue),
                              isDiscountActive: true
                            })
                          }
                        >
                          <option value="NONE">{labels.noDiscount}</option>
                          <option value="FIXED">{labels.fixedDiscount}</option>
                          <option value="PERCENTAGE">{labels.percentDiscount}</option>
                        </select>
                        <input
                          type="number"
                          min={0}
                          className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          defaultValue={Number(plan.discountValue)}
                          onBlur={(e) =>
                            updatePlanDiscount(plan.id, {
                              discountType: plan.discountType,
                              discountValue: Number(e.target.value),
                              isDiscountActive: plan.isDiscountActive
                            })
                          }
                        />
                        <button
                          type="button"
                          title={labels.applyDiscount}
                          onClick={() =>
                            updatePlanDiscount(plan.id, {
                              discountType: plan.discountType,
                              discountValue: Number(plan.discountValue),
                              isDiscountActive: true
                            })
                          }
                          className="rounded-lg border border-brand-200 bg-white p-2 text-brand-700"
                        >
                          <Percent size={14} />
                        </button>
                        {plan.isDiscountActive ? (
                          <button
                            type="button"
                            onClick={() => updatePlanDiscount(plan.id, { isDiscountActive: false })}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600"
                          >
                            <X size={14} />
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{labels.planDiscountHint}</p>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-800">{labels.categoryPricing}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setPricingPlanId(plan.id);
                            setPricingForm(initialPricingForm);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700"
                        >
                          <Plus size={14} />
                          {labels.addPricing}
                        </button>
                      </div>

                      {pricingGroups.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">{labels.noPricing}</p>
                      ) : (
                        <div className="space-y-3">
                          {pricingGroups.map(({ categoryId, category, rows }) => (
                            <div key={categoryId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                              <p className="mb-3 font-bold text-slate-800">{categoryLabel(category)}</p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {rows.map((row) => (
                                  <div key={row.id} className="rounded-xl bg-white p-3 text-sm">
                                    <p className="font-bold text-slate-700">
                                      {row.billingPeriod === 'MONTHLY' ? labels.monthly : labels.yearly}
                                    </p>
                                    <p className="mt-1 text-slate-500">
                                      {labels.price}: {formatPrice(Number(row.price))} → {labels.finalPrice}:{' '}
                                      <span className="font-bold text-brand-700">{formatPrice(Number(row.finalPrice ?? row.price))}</span>
                                    </p>
                                    <p className="text-slate-500">
                                      {labels.maxListings}: {row.maxListings}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-1">
                                      <select
                                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                                        value={row.discountType}
                                        onChange={(e) =>
                                          updateCategoryDiscount(row.id, {
                                            discountType: e.target.value,
                                            discountValue: Number(row.discountValue),
                                            isDiscountActive: true
                                          })
                                        }
                                      >
                                        <option value="NONE">{labels.noDiscount}</option>
                                        <option value="FIXED">{labels.fixedDiscount}</option>
                                        <option value="PERCENTAGE">{labels.percentDiscount}</option>
                                      </select>
                                      <input
                                        type="number"
                                        min={0}
                                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                                        defaultValue={Number(row.discountValue)}
                                        onBlur={(e) =>
                                          updateCategoryDiscount(row.id, {
                                            discountType: row.discountType,
                                            discountValue: Number(e.target.value),
                                            isDiscountActive: row.isDiscountActive
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {pricingPlanId ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-black">{labels.addPricing}</h3>
          <form onSubmit={submitPricing} className="grid gap-4 md:grid-cols-2">
            <Field label={labels.category}>
              <select
                className={inputClass}
                value={pricingForm.categoryId}
                onChange={(e) => setPricingForm({ ...pricingForm, categoryId: e.target.value })}
                required
              >
                <option value="">{labels.selectCategory}</option>
                {rootCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryLabel(category)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={labels.monthlyPrice}>
              <input className={inputClass} type="number" min={0} step="0.001" value={pricingForm.monthlyPrice} onChange={(e) => setPricingForm({ ...pricingForm, monthlyPrice: e.target.value })} required />
            </Field>
            <Field label={labels.monthlyMaxListings}>
              <input className={inputClass} type="number" min={1} value={pricingForm.monthlyMaxListings} onChange={(e) => setPricingForm({ ...pricingForm, monthlyMaxListings: e.target.value })} required />
            </Field>
            <Field label={labels.yearlyPrice}>
              <input className={inputClass} type="number" min={0} step="0.001" value={pricingForm.yearlyPrice} onChange={(e) => setPricingForm({ ...pricingForm, yearlyPrice: e.target.value })} required />
            </Field>
            <Field label={labels.yearlyMaxListings}>
              <input className={inputClass} type="number" min={1} value={pricingForm.yearlyMaxListings} onChange={(e) => setPricingForm({ ...pricingForm, yearlyMaxListings: e.target.value })} required />
            </Field>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={isSaving} className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                {labels.savePricing}
              </button>
              <button type="button" onClick={() => setPricingPlanId(undefined)} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">
                {labels.cancel}
              </button>
            </div>
          </form>
        </section>
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
