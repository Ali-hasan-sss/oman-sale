import { Suspense } from 'react';

import { MobileGoogleAuthPage } from '@/components/auth/mobile-google-auth-page';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MobileGoogleAuthPage />
    </Suspense>
  );
}
