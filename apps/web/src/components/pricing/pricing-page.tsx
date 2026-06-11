'use client';

import { Check, Sparkles, Store, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { PlanPriceWithVat } from '@/components/pricing/plan-price-with-vat';
import { api } from '@/lib/api';
import { canActivateStorePlanWithoutPayment } from '@/lib/store-plan-activation';
import { getBillingPeriodLabel, STORE_BILLING_PERIODS, type StoreBillingPeriod } from '@/lib/store-billing-period';
import { useI18n } from '@/lib/i18n';
import { formatOmrAmount } from '@/lib/plan-pricing';

type PromotionPlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  weekPrice: string | number;
  twoWeeksPrice: string | number;
  monthPrice: string | number;
  priorityScore?: number;
  dailyImpressions?: number;
  appearsFirst?: boolean;
  badgeLabel?: string | null;
  color?: string | null;
};

type RootCategory = {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  parentId?: string | null;
};

type StorePlanPricing = {
  id: string;
  billingPeriod: StoreBillingPeriod;
  price: string | number;
  basePrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  maxListings: number;
  categoryId: string;
  category?: { id: string; nameAr: string; nameEn: string; slug: string };
};

type StorePlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  sortOrder?: number;
  trialDays?: number;
  trialMaxListings?: number;
  isAdminFree?: boolean;
  promotionPlan?: {
    nameAr: string;
    nameEn: string;
    badgeLabel?: string | null;
    color?: string | null;
  } | null;
  pricing: StorePlanPricing[];
};

const PROMOTION_DURATIONS = [7, 14, 30] as const;

function featureLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function getPromotionPrice(plan: PromotionPlan, days: number) {
  if (days === 7) return Number(plan.weekPrice);
  if (days === 14) return Number(plan.twoWeeksPrice);
  return Number(plan.monthPrice);
}

export function PricingPage() {
  const { locale, dir, localizedPath, m } = useI18n();
  const t = m.pricing;

  const [promotionPlans, setPromotionPlans] = useState<PromotionPlan[]>([]);
  const [storePlans, setStorePlans] = useState<StorePlan[]>([]);
  const [categories, setCategories] = useState<RootCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [promotionDays, setPromotionDays] = useState<(typeof PROMOTION_DURATIONS)[number]>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<{ data: PromotionPlan[] }>('/promotions/plans'),
      api.get<{ data: StorePlan[] }>('/store-plans'),
      api.get<{ data: RootCategory[] }>('/categories', { params: { locale, includeInactive: false } })
    ])
      .then(([promotionsRes, storePlansRes, categoriesRes]) => {
        setPromotionPlans(promotionsRes.data.data);
        setStorePlans(storePlansRes.data.data);
        const roots = categoriesRes.data.data.filter((category) => !category.parentId);
        setCategories(roots);
        setSelectedCategoryId((current) => current || roots[0]?.id || '');
      })
      .catch(() => {
        setPromotionPlans([]);
        setStorePlans([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, [locale]);

  const filteredStorePlans = useMemo(() => {
    if (!selectedCategoryId) return storePlans;

    return storePlans
      .map((plan) => ({
        ...plan,
        pricing: plan.pricing.filter((row) => row.categoryId === selectedCategoryId)
      }))
      .filter((plan) => plan.pricing.length > 0)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [selectedCategoryId, storePlans]);

  const promotionDurationLabel = (days: number) => {
    if (days === 7) return t.durationWeek;
    if (days === 14) return t.durationTwoWeeks;
    return t.durationMonth;
  };

  return (
    <div className="site-page-shell bg-slate-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 via-teal-700 to-slate-900 p-8 text-white shadow-lg md:p-12">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-bold">
              <Sparkles size={16} />
              {t.heroBadge}
            </p>
            <h1 className="text-3xl font-black md:text-4xl">{t.pageTitle}</h1>
            <p className="mt-4 text-base leading-8 text-white/85 md:text-lg">{t.heroSubtitle}</p>
          </div>
        </section>

        {/* Promotion plans */}
        <section className="mb-16">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
                <Zap size={16} />
                {t.promotionsBadge}
              </div>
              <h2 className="text-2xl font-black text-slate-900 md:text-3xl">{t.promotionsTitle}</h2>
              <p className="mt-2 max-w-2xl text-slate-600">{t.promotionsSubtitle}</p>
            </div>
            <Link
              href={localizedPath('/add-listing')}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
            >
              {t.promoteCta}
            </Link>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {PROMOTION_DURATIONS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setPromotionDays(days)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  promotionDays === days
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                }`}
              >
                {promotionDurationLabel(days)}
              </button>
            ))}
          </div>

          {loading ? (
            <PricingCardsSkeleton count={3} />
          ) : promotionPlans.length === 0 ? (
            <EmptyState message={t.emptyPromotions} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {promotionPlans.map((plan, index) => {
                const name = locale === 'en' ? plan.nameEn : plan.nameAr;
                const description = locale === 'en' ? plan.descriptionEn : plan.descriptionAr;
                const features = featureLines(description);
                const basePrice = getPromotionPrice(plan, promotionDays);
                const highlighted = index === promotionPlans.length - 1 && promotionPlans.length > 1;

                return (
                  <article
                    key={plan.id}
                    className={`flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md ${
                      highlighted ? 'border-green-500 ring-2 ring-green-100' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div
                      className={`px-6 py-5 ${highlighted ? 'bg-green-600 text-white' : 'bg-slate-900 text-white'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-black">{name}</h3>
                        {plan.badgeLabel ? (
                          <span
                            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                            style={{ backgroundColor: plan.color || '#16a34a' }}
                          >
                            {plan.badgeLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <ul className="mb-6 flex-1 space-y-2">
                        {features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                            <Check size={16} className="mt-0.5 shrink-0 text-green-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto rounded-xl bg-slate-50 p-4 text-center">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                          {promotionDurationLabel(promotionDays)}
                        </p>
                        <PlanPriceWithVat
                          basePrice={basePrice}
                          locale={locale}
                          freeLabel={t.free}
                          vatShort={t.vatShort}
                          mainClassName="text-2xl font-black text-slate-900"
                          subClassName="mt-1 block text-xs text-slate-500"
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-sm text-slate-500">{t.promotionsNote}</p>
        </section>

        {/* Store plans */}
        <section>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-900">
                <Store size={16} />
                {t.storesBadge}
              </div>
              <h2 className="text-2xl font-black text-slate-900 md:text-3xl">{t.storesTitle}</h2>
              <p className="mt-2 max-w-2xl text-slate-600">{t.storesSubtitle}</p>
            </div>
            <Link
              href={localizedPath('/stores/create')}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              {t.createStoreCta}
            </Link>
          </div>

          {categories.length > 0 ? (
            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map((category) => {
                const label = category.name || (locale === 'en' ? category.nameEn : category.nameAr) || '';
                const active = selectedCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      active
                        ? 'bg-green-600 text-white shadow'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-green-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {loading ? (
            <PricingCardsSkeleton count={3} />
          ) : filteredStorePlans.length === 0 ? (
            <EmptyState message={t.emptyStores} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredStorePlans.map((plan, index) => {
                const name = locale === 'en' ? plan.nameEn : plan.nameAr;
                const description = locale === 'en' ? plan.descriptionEn : plan.descriptionAr;
                const features = featureLines(description);
                const highlighted = index === 1 && filteredStorePlans.length > 2;

                return (
                  <article
                    key={plan.id}
                    className={`flex flex-col overflow-hidden rounded-2xl border shadow-sm ${
                      highlighted ? 'border-green-500 ring-2 ring-green-100' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div
                      className={`min-h-[7rem] px-6 py-5 ${highlighted ? 'bg-green-600 text-white' : 'bg-slate-900 text-white'}`}
                    >
                      <h3 className="text-lg font-black">{name}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {plan.isAdminFree ? (
                          <span className="rounded-full bg-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-950">
                            {t.adminFreeBadge}
                          </span>
                        ) : null}
                        {plan.trialDays && plan.trialDays > 0 ? (
                          <span className="rounded-full bg-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                            {t.trialBadge} · {plan.trialDays} {t.trialDaysUnit}
                            {plan.trialMaxListings ? ` · ${plan.trialMaxListings} ${t.maxListings}` : ''}
                          </span>
                        ) : null}
                        {plan.promotionPlan ? (
                          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
                            {plan.promotionPlan.badgeLabel ||
                              (locale === 'en' ? plan.promotionPlan.nameEn : plan.promotionPlan.nameAr)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      {features.length > 0 ? (
                        <ul className="mb-5 space-y-2">
                          {features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                              <Check size={16} className="mt-0.5 shrink-0 text-green-600" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="mt-auto space-y-2">
                        {STORE_BILLING_PERIODS.map((period) => {
                          const row = plan.pricing.find((pricing) => pricing.billingPeriod === period);
                          if (!row) return null;

                          const listPrice = Number(row.basePrice ?? row.price ?? 0);
                          const finalPrice = Number(row.finalPrice ?? row.price ?? 0);
                          const discountAmount = Number(row.discountAmount ?? 0);
                          const isFree = canActivateStorePlanWithoutPayment(plan, period, finalPrice);
                          const hasDiscount = !isFree && discountAmount > 0 && listPrice > finalPrice;

                          return (
                            <div
                              key={period}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold text-slate-500">
                                    {getBillingPeriodLabel(period, locale)}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {row.maxListings} {t.maxListings}
                                  </p>
                                </div>
                                <div className="text-end">
                                  {isFree ? (
                                    <span className="text-lg font-black text-green-700">{t.free}</span>
                                  ) : (
                                    <div>
                                      {hasDiscount ? (
                                        <span className="block text-xs text-slate-400 line-through">
                                          {formatOmrAmount(listPrice, locale)}
                                        </span>
                                      ) : null}
                                      <PlanPriceWithVat
                                        basePrice={finalPrice}
                                        locale={locale}
                                        freeLabel={t.free}
                                        vatShort={t.vatShort}
                                        mainClassName="text-base font-black text-slate-900"
                                        subClassName="mt-0.5 block text-[11px] text-slate-500"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-sm text-slate-500">{t.storesNote}</p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function PricingCardsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
      {message}
    </div>
  );
}
