'use client';

import { PlanPriceWithVat } from '@/components/pricing/plan-price-with-vat';
import { canActivateStorePlanWithoutPayment } from '@/lib/store-plan-activation';
import { formatOmrAmount } from '@/lib/plan-pricing';
import {
  getBillingPeriodLabel,
  STORE_BILLING_PERIODS,
  type StoreBillingPeriod
} from '@/lib/store-billing-period';

type BillingPricingRow = {
  billingPeriod: StoreBillingPeriod;
  price: string | number;
  basePrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  maxListings: number;
};

type PlanInfo = {
  isAdminFree?: boolean;
};

type CreateStoreBillingPeriodCardsProps = {
  plan: PlanInfo;
  pricing: BillingPricingRow[];
  locale: 'ar' | 'en';
  selectedPeriod: StoreBillingPeriod | '';
  labels: {
    freePlan: string;
    maxListings: string;
    vatShort: string;
    discount: string;
  };
  onSelect: (period: StoreBillingPeriod) => void;
  paidOnly?: boolean;
};

export function CreateStoreBillingPeriodCards({
  plan,
  pricing,
  locale,
  selectedPeriod,
  labels,
  onSelect,
  paidOnly = false
}: CreateStoreBillingPeriodCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {STORE_BILLING_PERIODS.map((period) => {
        const row = pricing.find((item) => item.billingPeriod === period);
        if (!row) return null;

        const listPrice = Number(row.basePrice ?? row.price ?? 0);
        const finalPrice = Number(row.finalPrice ?? row.price ?? 0);
        const discountAmount = Number(row.discountAmount ?? 0);
        const isFree = canActivateStorePlanWithoutPayment(plan, period, finalPrice);
        if (paidOnly && isFree) return null;
        const hasDiscount = !isFree && discountAmount > 0 && listPrice > finalPrice;
        const selected = selectedPeriod === period;

        return (
          <button
            key={period}
            type="button"
            onClick={() => onSelect(period)}
            className={`rounded-2xl border p-5 text-center shadow-sm transition ${
              selected
                ? 'border-green-600 bg-green-50 ring-2 ring-green-100'
                : 'border-gray-200 bg-white hover:border-green-300'
            }`}
          >
            <span className="block text-sm font-bold text-gray-700">{getBillingPeriodLabel(period, locale)}</span>

            <div className="mt-3 min-h-[3.5rem]">
              {isFree ? (
                <span className="text-2xl font-black text-green-700">{labels.freePlan}</span>
              ) : (
                <div className="space-y-1">
                  {hasDiscount ? (
                    <>
                      <span className="block text-sm text-gray-400 line-through">
                        {formatOmrAmount(listPrice, locale)}
                      </span>
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                        {labels.discount}
                      </span>
                    </>
                  ) : null}
                  <PlanPriceWithVat
                    basePrice={finalPrice}
                    locale={locale}
                    freeLabel={labels.freePlan}
                    vatShort={labels.vatShort}
                    mainClassName="text-2xl font-black text-gray-900"
                    subClassName="mt-1 block text-xs font-normal text-gray-500"
                  />
                </div>
              )}
            </div>

            <span className="mt-3 block text-xs text-gray-500">
              {row.maxListings} {labels.maxListings}
            </span>
          </button>
        );
      })}
    </div>
  );
}
