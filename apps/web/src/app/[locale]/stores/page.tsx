import { Suspense } from 'react';

import { StoresBrowsePage } from '@/components/stores/stores-browse-page';

export default function StoresBrowseRoute() {
  return (
    <Suspense fallback={null}>
      <StoresBrowsePage />
    </Suspense>
  );
}
