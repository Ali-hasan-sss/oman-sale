'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CreateStoreBillingPeriodCards } from '@/components/stores/create-store-billing-period-cards';
import { CreateStorePlanSelectCard } from '@/components/stores/create-store-plan-select-card';
import { CreateStorePlansSkeleton } from '@/components/stores/create-store-plans-skeleton';
import { canActivateStorePlanWithoutPayment } from '@/lib/store-plan-activation';
import { type StoreBillingPeriod } from '@/lib/store-billing-period';

export type StorePlanPickerPlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  trialDays?: number;
  trialMaxListings?: number;
  trialAvailable?: boolean;
  isAdminFree?: boolean;
  sortOrder?: number;
  pricing: Array<{
    billingPeriod: StoreBillingPeriod;
    price: string | number;
    basePrice?: number;
    finalPrice?: number;
    discountAmount?: number;
    maxListings: number;
  }>;
};

type StorePlanPickerModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  freeSubmitLabel: string;
  paymentComingSoonLabel: string;
  locale: 'ar' | 'en';
  plans: StorePlanPickerPlan[];
  isLoading: boolean;
  isSubmitting: boolean;
  labels: {
    selectPeriod: string;
    selectPeriodHint: string;
    freePlan: string;
    maxListings: string;
    vatShort: string;
    discount: string;
    trialBadge: string;
    trialDays: string;
    adminFreeBadge: string;
    selectPlan: string;
    noPlans: string;
    cancel: string;
    submitting: string;
  };
  onSubmit: (planId: string, billingPeriod: StoreBillingPeriod) => void;
  paidOnly?: boolean;
  noPlansHint?: string;
};

export function StorePlanPickerModal({
  open,
  onClose,
  title,
  submitLabel,
  freeSubmitLabel,
  paymentComingSoonLabel,
  locale,
  plans,
  isLoading,
  isSubmitting,
  labels,
  onSubmit,
  paidOnly = false,
  noPlansHint
}: StorePlanPickerModalProps) {
  const [planId, setPlanId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<StoreBillingPeriod | ''>('');

  useEffect(() => {
    if (!open) {
      setPlanId('');
      setBillingPeriod('');
    }
  }, [open]);

  if (!open) return null;

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const selectedPricing = selectedPlan?.pricing.find((row) => row.billingPeriod === billingPeriod);
  const selectedPrice = Number(selectedPricing?.finalPrice ?? selectedPricing?.price ?? 0);
  const canActivateFree = Boolean(
    selectedPlan && billingPeriod && canActivateStorePlanWithoutPayment(selectedPlan, billingPeriod, selectedPrice)
  );
  const paymentBlocked = Boolean(selectedPlan && billingPeriod && !canActivateFree);

  const handleSelectPlan = (id: string) => {
    setPlanId(id);
    setBillingPeriod('');
  };

  const handleSubmit = () => {
    if (!planId || !billingPeriod || paymentBlocked) return;
    onSubmit(planId, billingPeriod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5">
          <h3 className="text-xl font-black text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 transition hover:bg-gray-100"
            aria-label={labels.cancel}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {isLoading ? (
            <CreateStorePlansSkeleton />
          ) : plans.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
              {noPlansHint ?? labels.noPlans}
            </p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <CreateStorePlanSelectCard
                    key={plan.id}
                    plan={plan}
                    locale={locale}
                    selected={planId === plan.id}
                    labels={{
                      trialBadge: labels.trialBadge,
                      trialDays: labels.trialDays,
                      maxListings: labels.maxListings,
                      adminFreeBadge: labels.adminFreeBadge,
                      selectPlan: labels.selectPlan
                    }}
                    onSelect={handleSelectPlan}
                  />
                ))}
              </div>

              {selectedPlan ? (
                <div className="space-y-3 border-t border-gray-100 pt-6">
                  <div>
                    <h4 className="text-base font-black text-gray-900">{labels.selectPeriod}</h4>
                    <p className="mt-1 text-sm text-gray-500">{labels.selectPeriodHint}</p>
                  </div>
                  <CreateStoreBillingPeriodCards
                    plan={selectedPlan}
                    pricing={selectedPlan.pricing}
                    locale={locale}
                    selectedPeriod={billingPeriod}
                    labels={{
                      freePlan: labels.freePlan,
                      maxListings: labels.maxListings,
                      vatShort: labels.vatShort,
                      discount: labels.discount
                    }}
                    onSelect={setBillingPeriod}
                    paidOnly={paidOnly}
                  />
                </div>
              ) : null}
            </>
          )}

          {paymentBlocked ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {paymentComingSoonLabel}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 px-5 py-3 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !planId || !billingPeriod || paymentBlocked || isLoading}
              className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {isSubmitting
                ? labels.submitting
                : paymentBlocked
                  ? paymentComingSoonLabel
                  : canActivateFree
                    ? freeSubmitLabel
                    : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
