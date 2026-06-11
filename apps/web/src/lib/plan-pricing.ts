export const PLAN_VAT_RATE = 0.05;

/** API/store subscription `finalPrice` is always before VAT. */
export function getPlanPreVatAmount(price: number) {
  return Number.isFinite(price) ? Math.max(0, price) : 0;
}

export type PlanPriceWithVat = {
  basePrice: number;
  vatAmount: number;
  finalPrice: number;
};

export function roundOmr(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function calculatePlanPriceWithVat(preVatPrice: number): PlanPriceWithVat {
  const basePrice = getPlanPreVatAmount(preVatPrice);
  if (basePrice <= 0) {
    return { basePrice: 0, vatAmount: 0, finalPrice: 0 };
  }

  const vatAmount = roundOmr(basePrice * PLAN_VAT_RATE);
  const finalPrice = roundOmr(basePrice + vatAmount);
  return { basePrice, vatAmount, finalPrice };
}

/** Total amount due at checkout or on invoice (pre-VAT + VAT). */
export function getPlanTotalWithVat(preVatPrice: number) {
  return calculatePlanPriceWithVat(preVatPrice).finalPrice;
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
