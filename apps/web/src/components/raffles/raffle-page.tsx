'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media-url';

type ActiveRaffle = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  startsAt: string;
  endsAt: string;
  imageUrl?: string | null;
  planPoints: Array<{
    planId: string;
    points: number;
    plan: {
      nameAr: string;
      nameEn: string;
      badgeLabel?: string | null;
      color?: string | null;
    };
  }>;
};

const labels = {
  ar: {
    title: 'السحب الحالي',
    empty: 'لا يوجد سحب نشط حالياً.',
    endsAt: 'ينتهي في',
    pointsTitle: 'النقاط حسب خطة التمييز',
    points: 'نقطة',
    cta: 'ميّز إعلانك وشارك',
    howItWorks: 'ميّز إعلانك خلال فترة السحب لتُسجَّل تلقائياً وتحصل على نقاط.'
  },
  en: {
    title: 'Current raffle',
    empty: 'There is no active raffle right now.',
    endsAt: 'Ends on',
    pointsTitle: 'Points per featured plan',
    points: 'points',
    cta: 'Promote your listing',
    howItWorks: 'Promote your listing during the raffle period to join automatically and earn points.'
  }
} as const;

export function RafflePage() {
  const { locale, localizedPath } = useI18n();
  const text = labels[locale];
  const [raffle, setRaffle] = useState<ActiveRaffle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: ActiveRaffle | null }>('/raffles/active')
      .then((response) => setRaffle(response.data.data))
      .catch(() => setRaffle(null))
      .finally(() => setIsLoading(false));
  }, []);

  const title = raffle ? (locale === 'ar' ? raffle.titleAr : raffle.titleEn) : '';
  const description = raffle ? (locale === 'ar' ? raffle.descriptionAr : raffle.descriptionEn) : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
              <Trophy className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">{text.title}</h1>
          </div>

          {isLoading ? (
            <p className="text-slate-500">...</p>
          ) : !raffle ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-slate-600">{text.empty}</p>
          ) : (
            <div className="space-y-6">
              {raffle.imageUrl ? (
                <img
                  src={resolveMediaUrl(raffle.imageUrl)}
                  alt={title}
                  className="h-56 w-full rounded-2xl object-cover md:h-72"
                />
              ) : null}

              <div>
                <h2 className="text-2xl font-black text-slate-900">{title}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {text.endsAt}: {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-GB', { dateStyle: 'long' }).format(new Date(raffle.endsAt))}
                </p>
              </div>

              <p className="whitespace-pre-wrap text-slate-700">{description}</p>
              <p className="rounded-2xl bg-brand-50 px-4 py-3 text-brand-800">{text.howItWorks}</p>

              <section>
                <h3 className="mb-3 text-lg font-bold text-slate-900">{text.pointsTitle}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {raffle.planPoints
                    .filter((item) => item.points > 0)
                    .map((item) => (
                      <div key={item.planId} className="rounded-2xl border border-slate-100 px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {locale === 'ar' ? item.plan.nameAr : item.plan.nameEn}
                        </p>
                        <p className="mt-1 text-brand-700">
                          {item.points} {text.points}
                        </p>
                      </div>
                    ))}
                </div>
              </section>

              <Link
                href={localizedPath('/add-listing')}
                className="inline-flex rounded-xl bg-brand-600 px-6 py-3 font-bold text-white hover:bg-brand-700"
              >
                {text.cta}
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
