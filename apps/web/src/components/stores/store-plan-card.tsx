'use client';

import { Check } from 'lucide-react';

import { PlanPriceWithVat } from '@/components/pricing/plan-price-with-vat';
import {
  getBillingPeriodLabel,
  STORE_BILLING_PERIODS,
  type StoreBillingPeriod
} from '@/lib/store-billing-period';

type StorePlanPricing = {
  billingPeriod: StoreBillingPeriod;
  finalPrice?: number;
  price: string | number;
  maxListings: number;
};

export type StorePlanCardData = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  trialDays?: number;
  trialMaxListings?: number;
  trialAvailable?: boolean;
  isAdminFree?: boolean;
  promotionPlan?: {
    nameAr: string;
    nameEn: string;
    badgeLabel?: string | null;
  } | null;
  pricing: StorePlanPricing[];
};

type StorePlanCardProps = {
  plan: StorePlanCardData;
  locale: 'ar' | 'en';
  selected: boolean;
  billingPeriod: StoreBillingPeriod;
  labels: {
    freePlan: string;
    maxListings: string;
    trialBadge: string;
    trialDays: string;
    selectPlan: string;
    vatShort: string;
  };
  onSelectPlan: (planId: string) => void;
  onSelectBilling: (planId: string, period: StoreBillingPeriod) => void;
};

function featureLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function StorePlanCard({
  plan,
  locale,
  selected,
  billingPeriod,
  labels,
  onSelectPlan,
  onSelectBilling
}: StorePlanCardProps) {
  const features = featureLines(locale === 'en' ? plan.descriptionEn : plan.descriptionAr);
  const name = locale === 'en' ? plan.nameEn : plan.nameAr;

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition ${
        selected ? 'border-green-600 ring-2 ring-green-100' : 'border-gray-200 bg-white'
      }`}
    >
      <div
        className={`flex min-h-[7.5rem] flex-col px-5 py-4 ${selected ? 'bg-green-600 text-white' : 'bg-slate-900 text-white'}`}
      >
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black">{name}</h3>
            <div className="mt-2 flex min-h-[2.75rem] flex-wrap content-start gap-2">
              {plan.trialAvailable && plan.trialDays ? (
                <span className="inline-block rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-amber-950">
                  {labels.trialBadge} · {plan.trialDays} {labels.trialDays}
                  {plan.trialMaxListings ? ` · ${plan.trialMaxListings} ${labels.maxListings}` : ''}
                </span>
              ) : null}
              {plan.promotionPlan ? (
                <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                  {plan.promotionPlan.badgeLabel || (locale === 'en' ? plan.promotionPlan.nameEn : plan.promotionPlan.nameAr)}
                </span>
              ) : null}
            </div>
          </div>
          <input
            className="mt-1"
            type="radio"
            name="store-plan"
            checked={selected}
            onChange={() => onSelectPlan(plan.id)}
            aria-label={labels.selectPlan}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {features.length > 0 ? (
          <ul className="mb-4 flex-1 space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                <Check size={16} className="mt-0.5 shrink-0 text-green-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-4 flex-1" />
        )}

        <div className="mt-auto space-y-2">
          {(plan.isAdminFree ? (['ONE_MONTH'] as const) : STORE_BILLING_PERIODS).map((period) => {
            const row = plan.pricing.find((pricing) => pricing.billingPeriod === period);
            if (!row) return null;

            const price = plan.isAdminFree ? 0 : Number(row.finalPrice ?? row.price ?? 0);

            return (
              <button
                key={period}
                type="button"
                onClick={() => onSelectBilling(plan.id, period)}
                className={`w-full rounded-xl border px-4 py-3 text-start text-sm font-bold transition ${
                  selected && billingPeriod === period
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 text-gray-700 hover:border-green-300'
                }`}
              >
                <span className="block text-xs uppercase tracking-wide opacity-70">
                  {getBillingPeriodLabel(period, locale)}
                </span>
                <span className="mt-1 block">
                  <PlanPriceWithVat
                    basePrice={price}
                    locale={locale}
                    freeLabel={labels.freePlan}
                    vatShort={labels.vatShort}
                  />
                </span>
                <span className="mt-1 block text-xs font-normal opacity-80">
                  {row.maxListings} {labels.maxListings}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
