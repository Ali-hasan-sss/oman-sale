import { Suspense } from 'react';

import { StoreCreateSuccessPage } from '@/components/stores/store-create-success-page';

export default function LocaleStoreCreateSuccessPage() {
  return (
    <Suspense fallback={null}>
      <StoreCreateSuccessPage />
    </Suspense>
  );
}
