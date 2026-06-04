import { Suspense } from 'react';

import { AllListingsPage } from '@/components/listings/all-listings-page';

export default function CategoryListingsRoute({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={null}>
      <AllListingsPage categorySlug={params.slug} />
    </Suspense>
  );
}
