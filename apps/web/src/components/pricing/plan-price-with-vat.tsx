'use client';

import { formatPlanVatBreakdown } from '@/lib/plan-pricing';

type PlanPriceWithVatProps = {
  basePrice: number;
  locale: 'ar' | 'en';
  freeLabel: string;
  vatShort: string;
  mainClassName?: string;
  subClassName?: string;
};

export function PlanPriceWithVat({
  basePrice,
  locale,
  freeLabel,
  vatShort,
  mainClassName = 'text-base font-bold',
  subClassName = 'mt-1 block text-xs font-normal opacity-80'
}: PlanPriceWithVatProps) {
  const { main, sub } = formatPlanVatBreakdown(basePrice, locale, { free: freeLabel, vatShort });

  return (
    <>
      <span className={mainClassName}>{main}</span>
      {sub ? <span className={subClassName}>{sub}</span> : null}
    </>
  );
}
