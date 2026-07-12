import { Suspense } from 'react';

import { StorePaymentSuccessPage } from '@/components/stores/store-payment-success-page';

export default function StorePaymentSuccessRoutePage() {
  return (
    <Suspense fallback={null}>
      <StorePaymentSuccessPage />
    </Suspense>
  );
}
