import { Suspense } from 'react';

import { NewsPage } from '@/components/articles/news-page';

export default function NewsRoutePage() {
  return (
    <Suspense fallback={null}>
      <NewsPage />
    </Suspense>
  );
}
