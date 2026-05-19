import { SiteFooter } from '@/components/home/site-footer';
import { TourismHeader } from '@/components/tourism/tourism-header';
import { TourismLandmarksPage } from '@/components/tourism/tourism-landmarks-page';

export default function TourismPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TourismHeader />
      <TourismLandmarksPage />
      <SiteFooter />
    </div>
  );
}
