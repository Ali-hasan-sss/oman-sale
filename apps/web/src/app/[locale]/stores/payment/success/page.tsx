import { Suspense } from 'react';

import { StorePaymentSuccessPage } from '@/components/stores/store-payment-success-page';

export default function LocaleStorePaymentSuccessRoutePage() {
  return (
    <Suspense fallback={null}>
      <StorePaymentSuccessPage />
    </Suspense>
  );
}
