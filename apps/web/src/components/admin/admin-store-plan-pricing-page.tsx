'use client';

import { ArrowRight, Percent, X } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { AdminTableSkeleton } from '@/components/admin/admin-table-skeleton';
import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';
import {
  getBillingPeriodLabel,
  STORE_BILLING_PERIODS,
  type StoreBillingPeriod
} from '@/lib/store-billing-period';

const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500';

type RootCategory = {
  id: string;
  nameAr: string;
  nameEn: string;
  parentId?: string | null;
};

type StorePlanPricing = {
  id: string;
  billingPeriod: StoreBillingPeriod;
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
  discountType: 'NONE' | 'FIXED' | 'PERCENTAGE';
  discountValue: string | number;
  isDiscountActive: boolean;
  pricing: StorePlanPricing[];
};

type CategoryPricingForm = {
  categoryId: string;
  oneMonthPrice: string;
  oneMonthMaxListings: string;
  twoMonthsPrice: string;
  twoMonthsMaxListings: string;
  threeMonthsPrice: string;
  threeMonthsMaxListings: string;
};

function formatPrice(value: number) {
  return value <= 0 ? '0.000' : value.toFixed(3);
}

export function AdminStorePlanPricingPage({ planId }: { planId: string }) {
  const { locale, localizedPath, m } = useI18n();
  const labels = m.adminStorePlans;
  const [plan, setPlan] = useState<StorePlan | null>(null);
  const [categories, setCategories] = useState<RootCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryPricingForm | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const [planRes, categoriesRes] = await Promise.all([
        adminApi().get<{ data: StorePlan }>(`/store-plans/${planId}`),
        adminApi().get<{ data: { items: RootCategory[] } }>('/admin/categories', { params: { all: true } })
      ]);
      setPlan(planRes.data.data);
      setCategories(categoriesRes.data.data.items.filter((category) => !category.parentId));
    } catch {
      setError(labels.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [planId]);

  const categoryLabel = (category?: RootCategory) =>
    locale === 'en' ? category?.nameEn || category?.nameAr : category?.nameAr || category?.nameEn;

  const groupedPricing = useMemo(() => {
    if (!plan) return [];

    const groups = new Map<string, StorePlanPricing[]>();
    for (const row of plan.pricing) {
      const current = groups.get(row.categoryId) ?? [];
      current.push(row);
      groups.set(row.categoryId, current);
    }

    return categories.map((category) => ({
      category,
      rows: groups.get(category.id) ?? []
    }));
  }, [categories, plan]);

  const updatePlanDiscount = async (payload: {
    discountType?: string;
    discountValue?: number;
    isDiscountActive?: boolean;
  }) => {
    if (!plan) return;
    await adminApi().patch(`/store-plans/${plan.id}/discount`, payload);
    await loadData();
  };

  const updateCategoryDiscount = async (
    pricingId: string,
    payload: { discountType?: string; discountValue?: number; isDiscountActive?: boolean }
  ) => {
    await adminApi().patch(`/store-plans/pricing/${pricingId}/discount`, payload);
    await loadData();
  };

  const openCategoryEditor = (categoryId: string) => {
    const rows = plan?.pricing.filter((row) => row.categoryId === categoryId) ?? [];
    const findRow = (period: StoreBillingPeriod) =>
      rows.find((row) => row.billingPeriod === period) ??
      plan?.pricing.find((row) => row.billingPeriod === period);
    const oneMonth = findRow('ONE_MONTH');
    const twoMonths = findRow('TWO_MONTHS');
    const threeMonths = findRow('THREE_MONTHS');

    setCategoryForm({
      categoryId,
      oneMonthPrice: String(oneMonth?.price ?? 0),
      oneMonthMaxListings: String(oneMonth?.maxListings ?? 10),
      twoMonthsPrice: String(twoMonths?.price ?? 0),
      twoMonthsMaxListings: String(twoMonths?.maxListings ?? 20),
      threeMonthsPrice: String(threeMonths?.price ?? 0),
      threeMonthsMaxListings: String(threeMonths?.maxListings ?? 30)
    });
    setEditingCategoryId(categoryId);
  };

  const submitCategoryPricing = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryForm) return;

    setIsSaving(true);
    try {
      await adminApi().post(`/store-plans/${planId}/pricing/bulk`, {
        categoryId: categoryForm.categoryId,
        oneMonthPrice: Number(categoryForm.oneMonthPrice),
        oneMonthMaxListings: Number(categoryForm.oneMonthMaxListings),
        twoMonthsPrice: Number(categoryForm.twoMonthsPrice),
        twoMonthsMaxListings: Number(categoryForm.twoMonthsMaxListings),
        threeMonthsPrice: Number(categoryForm.threeMonthsPrice),
        threeMonthsMaxListings: Number(categoryForm.threeMonthsMaxListings)
      });
      setEditingCategoryId(null);
      setCategoryForm(null);
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const planName = plan ? (locale === 'en' ? plan.nameEn : plan.nameAr) : '';

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <Link
          href={localizedPath('/admin/store-plans')}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:underline"
        >
          <ArrowRight size={16} className={locale === 'en' ? 'rotate-180' : undefined} />
          {labels.backToPlans}
        </Link>
        <h2 className="text-2xl font-black">{labels.pricingPageTitle}</h2>
        {plan ? <p className="mt-1 text-sm font-bold text-slate-600">{planName}</p> : null}
        <p className="mt-1 text-sm text-slate-500">{labels.pricingPageSubtitle}</p>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
      </section>

      {isLoading ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <AdminTableSkeleton columnTypes={['text', 'text', 'text', 'badge', 'actions']} rows={6} />
        </section>
      ) : plan ? (
        <>
          <section className="rounded-3xl border border-brand-100 bg-brand-50/60 p-6 shadow-sm">
            <p className="mb-3 text-sm font-black text-brand-800">{labels.planDiscount}</p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={plan.discountType}
                onChange={(e) =>
                  updatePlanDiscount({
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
                className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                defaultValue={Number(plan.discountValue)}
                onBlur={(e) =>
                  updatePlanDiscount({
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
                  updatePlanDiscount({
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
                  onClick={() => updatePlanDiscount({ isDiscountActive: false })}
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">{labels.planDiscountHint}</p>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">{labels.category}</th>
                  {STORE_BILLING_PERIODS.map((period) => (
                    <th key={period} className="px-4 py-3 text-start">
                      {getBillingPeriodLabel(period, locale)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-start">{labels.discount}</th>
                  <th className="px-4 py-3 text-start">{labels.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedPricing.map(({ category, rows }) => {
                  return (
                    <tr key={category.id}>
                      <td className="px-4 py-4 font-bold text-slate-900">{categoryLabel(category)}</td>
                      {STORE_BILLING_PERIODS.map((period) => {
                        const row = rows.find((pricing) => pricing.billingPeriod === period);

                        return (
                          <td key={period} className="px-4 py-4 text-slate-600">
                            {row ? (
                              <div>
                                <p>
                                  {formatPrice(Number(row.finalPrice ?? row.price))} {labels.omr}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {labels.maxListings}: {row.maxListings}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4">
                        {rows.length > 0 ? (
                          <div className="space-y-2">
                            {rows.map((row) => (
                              <div key={row.id} className="flex flex-wrap items-center gap-1">
                                <span className="text-xs font-bold text-slate-500">
                                  {getBillingPeriodLabel(row.billingPeriod, locale)}:
                                </span>
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
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openCategoryEditor(category.id)}
                          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700"
                        >
                          {labels.editCategoryPricing}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      ) : null}

      {editingCategoryId && categoryForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-xl font-black text-slate-900">{labels.editCategoryPricing}</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryForm(null);
                }}
                className="rounded-full p-2 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-sm font-bold text-slate-600">
              {categoryLabel(categories.find((category) => category.id === categoryForm.categoryId))}
            </p>
            <form onSubmit={submitCategoryPricing} className="grid gap-4 sm:grid-cols-2">
              <Field label={labels.oneMonthPrice}>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step="0.001"
                  value={categoryForm.oneMonthPrice}
                  onChange={(e) => setCategoryForm({ ...categoryForm, oneMonthPrice: e.target.value })}
                  required
                />
              </Field>
              <Field label={labels.oneMonthMaxListings}>
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  value={categoryForm.oneMonthMaxListings}
                  onChange={(e) => setCategoryForm({ ...categoryForm, oneMonthMaxListings: e.target.value })}
                  required
                />
              </Field>
              <Field label={labels.twoMonthsPrice}>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step="0.001"
                  value={categoryForm.twoMonthsPrice}
                  onChange={(e) => setCategoryForm({ ...categoryForm, twoMonthsPrice: e.target.value })}
                  required
                />
              </Field>
              <Field label={labels.twoMonthsMaxListings}>
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  value={categoryForm.twoMonthsMaxListings}
                  onChange={(e) => setCategoryForm({ ...categoryForm, twoMonthsMaxListings: e.target.value })}
                  required
                />
              </Field>
              <Field label={labels.threeMonthsPrice}>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step="0.001"
                  value={categoryForm.threeMonthsPrice}
                  onChange={(e) => setCategoryForm({ ...categoryForm, threeMonthsPrice: e.target.value })}
                  required
                />
              </Field>
              <Field label={labels.threeMonthsMaxListings}>
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  value={categoryForm.threeMonthsMaxListings}
                  onChange={(e) => setCategoryForm({ ...categoryForm, threeMonthsMaxListings: e.target.value })}
                  required
                />
              </Field>
              <div className="flex gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {labels.savePricing}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(null);
                    setCategoryForm(null);
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700"
                >
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
