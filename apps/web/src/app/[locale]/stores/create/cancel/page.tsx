import { Suspense } from 'react';

import { StoreCreateCancelPage } from '@/components/stores/store-create-cancel-page';

export default function LocaleStoreCreateCancelPage() {
  return (
    <Suspense fallback={null}>
      <StoreCreateCancelPage />
    </Suspense>
  );
}
