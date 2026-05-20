import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';

export type PromotionPlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  weekPrice: string | number;
  twoWeeksPrice: string | number;
  monthPrice: string | number;
  badgeLabel?: string | null;
  color?: string | null;
};

export async function fetchPromotionPlans() {
  const response = await http.get<ApiEnvelope<PromotionPlan[]>>(API_ENDPOINTS.promotions.plans);
  return Array.isArray(response.data.data) ? response.data.data : [];
}

export async function promoteAdRequest(payload: { adId: string; planId: string; days: number }) {
  const response = await http.post<ApiEnvelope<unknown>>(API_ENDPOINTS.promotions.adPromotions, payload);
  return response.data.data;
}

export function getPlanPrice(plan: PromotionPlan, days: number) {
  if (days === 7) return Number(plan.weekPrice);
  if (days === 14) return Number(plan.twoWeeksPrice);
  return Number(plan.monthPrice);
}

export function formatPlanPrice(price: number, locale: 'ar' | 'en', freeLabel: string) {
  if (price === 0) return freeLabel;
  return locale === 'en' ? `OMR ${price.toLocaleString('en-US')}` : `${price.toLocaleString('en-US')} ر.ع`;
}
