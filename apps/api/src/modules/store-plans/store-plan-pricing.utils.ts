import { StoreDiscountType } from '@prisma/client';

export type DiscountConfig = {
  discountType: StoreDiscountType;
  discountValue: number | string | { toString(): string };
  isDiscountActive: boolean;
};

export type PricingRow = DiscountConfig & {
  price: number | string | { toString(): string };
};

function applySingleDiscount(price: number, config: DiscountConfig) {
  if (!config.isDiscountActive || config.discountType === StoreDiscountType.NONE) {
    return { discountAmount: 0, finalPrice: Math.max(0, price) };
  }

  const discountValue = Number(config.discountValue);

  if (config.discountType === StoreDiscountType.FIXED) {
    const discountAmount = Math.min(price, discountValue);
    return { discountAmount, finalPrice: Math.max(0, price - discountAmount) };
  }

  if (config.discountType === StoreDiscountType.PERCENTAGE) {
    const pct = Math.min(100, Math.max(0, discountValue));
    const discountAmount = price * (pct / 100);
    return { discountAmount, finalPrice: Math.max(0, price - discountAmount) };
  }

  return { discountAmount: 0, finalPrice: Math.max(0, price) };
}

export function computeStorePlanFinalPrice(row: PricingRow, planDiscount?: DiscountConfig) {
  const basePrice = Number(row.price);
  let currentPrice = basePrice;
  let totalDiscount = 0;

  if (planDiscount) {
    const planResult = applySingleDiscount(currentPrice, planDiscount);
    totalDiscount += planResult.discountAmount;
    currentPrice = planResult.finalPrice;
  }

  const categoryResult = applySingleDiscount(currentPrice, row);
  totalDiscount += categoryResult.discountAmount;

  return {
    basePrice,
    planDiscountAmount: planDiscount ? applySingleDiscount(basePrice, planDiscount).discountAmount : 0,
    categoryDiscountAmount: categoryResult.discountAmount,
    discountAmount: totalDiscount,
    finalPrice: categoryResult.finalPrice
  };
}

export function withComputedPricing<T extends PricingRow>(row: T, planDiscount?: DiscountConfig) {
  const computed = computeStorePlanFinalPrice(row, planDiscount);
  return { ...row, ...computed };
}

export function getPlanDiscount(plan: DiscountConfig) {
  return plan;
}
