'use client';

import { useState } from 'react';

import { AdminBannerRequestsManagement } from '@/components/admin/admin-banner-requests-management';
import { AdminHeroBannersManagement } from '@/components/admin/admin-hero-banners-management';
import { BANNER_PLACEMENTS, bannerPlacementCopy, type BannerPlacement } from '@/lib/banner-placements';
import { useI18n } from '@/lib/i18n';

export function AdminBannerPlacements() {
  const { locale, m } = useI18n();
  const [placement, setPlacement] = useState<BannerPlacement>('HOME_BELOW_HERO');
  const copy = bannerPlacementCopy[placement][locale];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">{m.admin.bannerManagement}</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          {locale === 'ar'
            ? 'اختر مكان البنر لإدارة صوره وسعر الإعلان فيه وطلباته بشكل منفصل.'
            : 'Choose a banner slot to manage its images, advertising price, and requests separately.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {BANNER_PLACEMENTS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPlacement(item)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              placement === item ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {bannerPlacementCopy[item][locale].admin}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-600">
        {locale === 'ar' ? `المكان المحدد: ${copy.admin}. ${copy.subtitle}` : `Selected slot: ${copy.admin}. ${copy.subtitle}`}
      </p>

      <AdminHeroBannersManagement key={`banners-${placement}`} placement={placement} />
      <AdminBannerRequestsManagement key={`requests-${placement}`} placement={placement} embedded />
    </section>
  );
}
