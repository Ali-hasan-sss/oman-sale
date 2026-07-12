import { Suspense } from 'react';

import { ListingPaymentSuccessPage } from '@/components/listings/listing-payment-success-page';

export default function ListingPaymentSuccessRoute() {
  return (
    <Suspense fallback={null}>
      <ListingPaymentSuccessPage />
    </Suspense>
  );
}
