export const PLAN_VAT_RATE = 0.05;

export type PlanPriceWithVat = {
  basePrice: number;
  vatAmount: number;
  finalPrice: number;
};

export function roundOmr(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function calculatePlanPriceWithVat(basePrice: number): PlanPriceWithVat {
  const base = Number.isFinite(basePrice) ? Math.max(0, basePrice) : 0;
  if (base <= 0) {
    return { basePrice: 0, vatAmount: 0, finalPrice: 0 };
  }

  const vatAmount = roundOmr(base * PLAN_VAT_RATE);
  const finalPrice = roundOmr(base + vatAmount);
  return { basePrice: base, vatAmount, finalPrice };
}

export function formatOmrAmount(amount: number, locale: 'ar' | 'en', freeLabel = '') {
  if (amount <= 0) return freeLabel;
  const formatted = amount.toFixed(3);
  return locale === 'en' ? `${formatted} OMR` : `${formatted} ر.ع`;
}

export function formatPlanVatBreakdown(
  basePrice: number,
  locale: 'ar' | 'en',
  labels: { free: string; vatShort: string }
) {
  const pricing = calculatePlanPriceWithVat(basePrice);
  if (pricing.finalPrice <= 0) {
    return { main: labels.free, sub: '', pricing };
  }

  const main = formatOmrAmount(pricing.finalPrice, locale);
  const sub =
    locale === 'en'
      ? `${pricing.basePrice.toFixed(3)} + 5% ${labels.vatShort}`
      : `${pricing.basePrice.toFixed(3)} + 5% ${labels.vatShort}`;

  return { main, sub, pricing };
}
