import { Suspense } from 'react';

import { AllListingsPage } from '@/components/listings/all-listings-page';

export default function AllListingsRoute() {
  return (
    <Suspense fallback={null}>
      <AllListingsPage />
    </Suspense>
  );
}
