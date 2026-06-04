import { Suspense } from 'react';

import { GlobalSearchPage } from '@/components/search/global-search-page';

export default function SearchRoute() {
  return (
    <Suspense fallback={null}>
      <GlobalSearchPage />
    </Suspense>
  );
}
