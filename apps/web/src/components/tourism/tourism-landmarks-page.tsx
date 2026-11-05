'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { AdBannerSlot } from '@/components/home/hero-banners-section';
import { LandmarkGrid, LandmarksHeader } from '@/components/tourism/landmark-cards';
import { tourismDestinations, tourismFeatures, tourismPageContent } from '@/data/tourism';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media-url';

type ApiTourismDestination = {
  id: string;
  slug: string;
  imageUrl: string;
  titleAr: string;
  titleEn: string;
  aboutAr?: string;
  aboutEn?: string;
  addressAr?: string;
  addressEn?: string;
};

export function TourismLandmarksPage() {
  const { locale, localizedPath } = useI18n();
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim().toLowerCase();
  const content = tourismPageContent[locale];
  const [destinations, setDestinations] = useState<ApiTourismDestination[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: ApiTourismDestination[] }>('/tourism/destinations')
      .then((response) => {
        if (!cancelled) setDestinations(response.data.data);
      })
      .catch(() => {
        if (!cancelled) setDestinations([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayDestinations = useMemo(() => {
    const base =
      destinations.length > 0
        ? destinations.map((destination) => ({
            id: destination.slug,
            image: resolveMediaUrl(destination.imageUrl),
            title: locale === 'en' ? destination.titleEn : destination.titleAr,
            place: (locale === 'en' ? destination.addressEn : destination.addressAr) ?? '',
            description: (locale === 'en' ? destination.aboutEn : destination.aboutAr) ?? ''
          }))
        : tourismDestinations.map((destination) => ({
            id: destination.id,
            image: destination.image,
            title: destination.title[locale],
            place: locale === 'en' ? 'Sultanate of Oman' : 'سلطنة عُمان',
            description: ''
          }));

    if (!query) return base;

    return base.filter(
      (destination) =>
        destination.title.toLowerCase().includes(query) || destination.id.toLowerCase().includes(query)
    );
  }, [destinations, locale, query]);

  return (
    <main className="site-container site-page-main min-w-0">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">{content.title}</h1>
        <p className="text-gray-600">{content.subtitle}</p>
      </div>

      <AdBannerSlot placement="TOURISM" variant="inline" />

      <div className="mb-12 rounded-xl bg-gradient-to-r from-brand-700 to-brick-600 p-8 text-white md:p-12">
        <h2 className="mb-4 text-3xl font-bold">{content.heroTitle}</h2>
        <p className="max-w-2xl text-lg leading-8">{content.heroDescription}</p>
      </div>

      <LandmarksHeader count={displayDestinations.length} locale={locale} />
      <LandmarkGrid
        locale={locale}
        items={displayDestinations}
        hrefFor={(item) => localizedPath(`/destination/${item.id}`)}
      />

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {tourismFeatures.map((feature) => (
          <div key={feature.title.ar} className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-3 text-4xl">{feature.icon}</div>
            <h3 className="mb-2 font-bold text-slate-900">{feature.title[locale]}</h3>
            <p className="text-sm leading-6 text-gray-600">{feature.description[locale]}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
