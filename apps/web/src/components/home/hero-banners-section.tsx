'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type HeroBanner = {
  id: string;
  sortOrder: number;
  imageUrl: string;
  text?: string | null;
  linkUrl: string;
};

export function HeroBannersSection() {
  const { locale } = useI18n();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const title = locale === 'en' ? 'Featured Offers' : 'عروض مميزة';
  const subtitle =
    locale === 'en'
      ? 'Discover highlighted deals and announcements selected for you.'
      : 'اكتشف عروضاً وإعلانات مختارة بعناية لتناسب اهتماماتك.';

  useEffect(() => {
    let cancelled = false;

    const loadBanners = async () => {
      try {
        const response = await api.get<{ data: HeroBanner[] }>('/hero/banners', {
          params: { locale }
        });
        if (!cancelled) setBanners(response.data.data);
      } catch {
        if (!cancelled) setBanners([]);
      }
    };

    void loadBanners();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (banners.length === 0) return null;

  return (
    <section className="bg-slate-50 px-4 pt-12 md:pt-16">
      <div className="mx-auto mb-5 max-w-[1010px] text-center">
        <h2 className="text-2xl font-black text-slate-900 md:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-slate-500 md:text-base">{subtitle}</p>
      </div>

      <div className="mx-auto flex max-w-[1010px] flex-col gap-4">
        {banners.map((banner) => (
          <a
            key={banner.id}
            href={banner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <img
              src={banner.imageUrl}
              alt={banner.text ?? 'Advertisement'}
              className="aspect-[990/250] w-full cursor-pointer object-cover"
              loading="lazy"
            />
            {banner.text ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white">
                <p className="text-sm font-bold drop-shadow sm:text-lg">{banner.text}</p>
              </div>
            ) : null}
          </a>
        ))}
      </div>
    </section>
  );
}
