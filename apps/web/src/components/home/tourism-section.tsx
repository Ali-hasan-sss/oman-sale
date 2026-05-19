'use client';

import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

const experiences = [
  {
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=450&fit=crop'
  },
  {
    image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&h=450&fit=crop'
  },
  {
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=450&fit=crop'
  },
  {
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=450&fit=crop'
  }
];

const destinations = [
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=500&h=320&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500&h=320&fit=crop',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=500&h=320&fit=crop',
  'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=500&h=320&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&h=320&fit=crop',
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=500&h=320&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&h=320&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=320&fit=crop'
];

type ApiTourismDestination = {
  id: string;
  slug: string;
  imageUrl: string;
  titleAr: string;
  titleEn: string;
  rating: string;
  ratingLabelAr: string;
  ratingLabelEn: string;
  bestTimeAr: string;
  bestTimeEn: string;
  addressAr: string;
  addressEn: string;
};

export function TourismSection() {
  const { locale, localizedPath, m } = useI18n();
  const [apiDestinations, setApiDestinations] = useState<ApiTourismDestination[]>([]);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ data: ApiTourismDestination[] }>('/tourism/destinations')
      .then((response) => {
        if (!cancelled) setApiDestinations(response.data.data);
      })
      .catch(() => {
        if (!cancelled) setApiDestinations([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayDestinations = useMemo(
    () =>
      apiDestinations.length > 0
        ? apiDestinations.map((destination) => ({
            id: destination.slug,
            image: destination.imageUrl,
            title: locale === 'en' ? destination.titleEn : destination.titleAr,
            rating: destination.rating,
            ratingLabel: locale === 'en' ? destination.ratingLabelEn : destination.ratingLabelAr,
            bestTime: locale === 'en' ? destination.bestTimeEn : destination.bestTimeAr,
            address: locale === 'en' ? destination.addressEn : destination.addressAr
          }))
        : destinations.map((image, index) => ({
            id: String(index + 1),
            image,
            title: m.home.destinations[index] ?? '',
            rating: '4.9',
            ratingLabel: locale === 'en' ? 'Excellent rating' : 'تقييم ممتاز',
            bestTime: locale === 'en' ? 'Year-round' : 'طوال العام',
            address: locale === 'en' ? 'Sultanate of Oman' : 'سلطنة عمان'
          })),
    [apiDestinations, locale, m.home.destinations]
  );

  const featuredExperiences = displayDestinations.slice(0, 4);

  return (
    <>
      <section className="mb-14 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 to-teal-950 p-8 text-white md:p-12">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            {experiences.map((experience, index) => {
              const [title, description] = m.home.experiences[index] ?? ['', ''];
              const destination = featuredExperiences[index];

              return (
              <Link
                key={title}
                href={localizedPath(`/destination/${destination?.id ?? index + 1}`)}
                className="group relative h-48 cursor-pointer overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-105"
              >
                <img src={destination?.image ?? experience.image} alt={destination?.title ?? title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="mb-1 text-lg font-bold">{destination?.title ?? title}</h3>
                  <p className="text-xs text-white/85">{description}</p>
                </div>
              </Link>
              );
            })}
          </div>

          <div className="text-right">
            <h2 className="mb-4 text-4xl font-black md:text-5xl">{m.home.tourismTitle}</h2>
            <p className="mb-8 text-lg leading-relaxed text-white/90">{m.home.tourismDescription}</p>
            <div className="mb-8 grid grid-cols-3 gap-6">
              <Stat value={`+${Math.max(displayDestinations.length, 8)}`} label={m.home.stats[0] ?? ''} />
              <Stat value="+200" label={m.home.stats[1] ?? ''} />
              <Stat value={`+${new Set(displayDestinations.map((destination) => destination.address)).size}`} label={m.home.stats[2] ?? ''} />
            </div>
            <Link
              href={localizedPath('/tourism')}
              className="inline-flex rounded-xl bg-desert-500 px-6 py-3 font-bold text-white transition hover:bg-desert-600"
            >
              {m.home.tourismCta}
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-bold text-brand-600">{m.home.exploreOman}</p>
          <h2 className="text-3xl font-black">{m.home.destinationsTitle}</h2>
          <p className="mt-2 text-slate-600">{m.home.destinationsSubtitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {displayDestinations.map((destination) => {
            return (
            <Link
              key={destination.id}
              href={localizedPath(`/destination/${destination.id}`)}
              className="group relative block h-52 overflow-hidden rounded-2xl"
            >
              <img src={destination.image} alt={destination.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <div className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-amber-600">
                  <Star size={13} fill="currentColor" />
                  <span>{destination.rating}</span>
                  <span className="text-slate-500">{destination.ratingLabel}</span>
                </div>
                <h3 className="text-xl font-black text-white">{destination.title}</h3>
                <p className="mt-1 line-clamp-1 text-xs text-white/85">{destination.bestTime}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-white/80">
                  <MapPin size={13} />
                  <span className="line-clamp-1">{destination.address}</span>
                </p>
              </div>
            </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="mb-1 text-3xl font-black">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
    </div>
  );
}
