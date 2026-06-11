/** Plan/listing prices from the database are always before VAT. */
export const PLAN_VAT_RATE = 0.05;

export function roundOmr(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function calculatePlanPriceWithVat(preVatPrice: number) {
  const basePrice = Number.isFinite(preVatPrice) ? Math.max(0, preVatPrice) : 0;
  if (basePrice <= 0) {
    return { basePrice: 0, vatAmount: 0, totalWithVat: 0 };
  }

  const vatAmount = roundOmr(basePrice * PLAN_VAT_RATE);
  const totalWithVat = roundOmr(basePrice + vatAmount);
  return { basePrice, vatAmount, totalWithVat };
}

/** Amount charged at checkout (plan price + VAT). */
export function getPlanChargeAmount(preVatPrice: number) {
  return calculatePlanPriceWithVat(preVatPrice).totalWithVat;
}
