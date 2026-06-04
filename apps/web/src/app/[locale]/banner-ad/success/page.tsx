import { Suspense } from 'react';

import { BannerAdSuccessPage } from '@/components/banner-ads/banner-ad-success-page';

export default function LocaleBannerAdSuccessPage() {
  return (
    <Suspense fallback={null}>
      <BannerAdSuccessPage />
    </Suspense>
  );
}
