import { Suspense } from 'react';

import { ListingPaymentCancelPage } from '@/components/listings/listing-payment-cancel-page';

export default function LocaleListingPaymentCancelRoute() {
  return (
    <Suspense fallback={null}>
      <ListingPaymentCancelPage />
    </Suspense>
  );
}
