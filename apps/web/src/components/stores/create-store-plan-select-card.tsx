'use client';

import { Check } from 'lucide-react';

export type CreateStorePlanSelectData = {
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
};

type CreateStorePlanSelectCardProps = {
  plan: CreateStorePlanSelectData;
  locale: 'ar' | 'en';
  selected: boolean;
  labels: {
    trialBadge: string;
    trialDays: string;
    maxListings: string;
    adminFreeBadge: string;
    selectPlan: string;
  };
  onSelect: (planId: string) => void;
};

function featureLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function CreateStorePlanSelectCard({
  plan,
  locale,
  selected,
  labels,
  onSelect
}: CreateStorePlanSelectCardProps) {
  const features = featureLines(locale === 'en' ? plan.descriptionEn : plan.descriptionAr);
  const name = locale === 'en' ? plan.nameEn : plan.nameAr;

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={`flex h-full flex-col overflow-hidden rounded-2xl border text-start shadow-sm transition ${
        selected ? 'border-green-600 ring-2 ring-green-100' : 'border-gray-200 bg-white hover:border-green-300'
      }`}
    >
      <div
        className={`flex min-h-[7.5rem] flex-col px-5 py-4 ${selected ? 'bg-green-600 text-white' : 'bg-slate-900 text-white'}`}
      >
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black">{name}</h3>
            <div className="mt-2 flex min-h-[2.75rem] flex-wrap content-start gap-2">
              {plan.isAdminFree ? (
                <span className="inline-block rounded-full bg-emerald-300 px-2 py-0.5 text-xs font-bold text-emerald-950">
                  {labels.adminFreeBadge}
                </span>
              ) : null}
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
          <span
            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              selected ? 'border-white bg-white text-green-600' : 'border-white/60'
            }`}
            aria-hidden
          >
            {selected ? <Check size={12} strokeWidth={3} /> : null}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {features.length > 0 ? (
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                <Check size={16} className="mt-0.5 shrink-0 text-green-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">{labels.selectPlan}</p>
        )}
      </div>
    </button>
  );
}
