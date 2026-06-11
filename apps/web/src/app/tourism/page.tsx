import { Suspense } from 'react';

import { SiteFooter } from '@/components/home/site-footer';
import { TourismHeader } from '@/components/tourism/tourism-header';
import { TourismLandmarksPage } from '@/components/tourism/tourism-landmarks-page';

export default function TourismPage() {
  return (
    <div className="site-page-shell bg-slate-50">
      <TourismHeader />
      <Suspense fallback={null}>
        <TourismLandmarksPage />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
