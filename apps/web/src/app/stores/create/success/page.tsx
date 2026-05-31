import { Suspense } from 'react';

import { StoreCreateSuccessPage } from '@/components/stores/store-create-success-page';

export default function StoreCreateSuccessRoute() {
  return (
    <Suspense fallback={null}>
      <StoreCreateSuccessPage />
    </Suspense>
  );
}
