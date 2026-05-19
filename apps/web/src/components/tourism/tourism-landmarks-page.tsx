'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { tourismDestinations, tourismFeatures, tourismPageContent } from '@/data/tourism';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type ApiTourismDestination = {
  id: string;
  slug: string;
  imageUrl: string;
  titleAr: string;
  titleEn: string;
};

export function TourismLandmarksPage() {
  const { locale, localizedPath } = useI18n();
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

  const displayDestinations =
    destinations.length > 0
      ? destinations.map((destination) => ({
          id: destination.slug,
          image: destination.imageUrl,
          title: locale === 'en' ? destination.titleEn : destination.titleAr
        }))
      : tourismDestinations.map((destination) => ({
          id: destination.id,
          image: destination.image,
          title: destination.title[locale]
        }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">{content.title}</h1>
        <p className="text-gray-600">{content.subtitle}</p>
      </div>

      <div className="mb-12 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 p-8 text-white md:p-12">
        <h2 className="mb-4 text-3xl font-bold">{content.heroTitle}</h2>
        <p className="max-w-2xl text-lg leading-8">{content.heroDescription}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {displayDestinations.map((destination) => {
          return (
            <Link
              key={destination.id}
              href={localizedPath(`/destination/${destination.id}`)}
              className="group relative block h-40 cursor-pointer overflow-hidden rounded-2xl"
            >
              <img
                src={destination.image}
                alt={destination.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
              <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                <h3 className="text-xl font-bold text-white">{destination.title}</h3>
              </div>
            </Link>
          );
        })}
      </div>

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
