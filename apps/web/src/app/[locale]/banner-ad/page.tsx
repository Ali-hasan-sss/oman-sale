import { Suspense } from 'react';

import { BannerAdRequestPage } from '@/components/banner-ads/banner-ad-request-page';

export default function LocaleBannerAdPage() {
  return (
    <Suspense fallback={null}>
      <BannerAdRequestPage />
    </Suspense>
  );
}
