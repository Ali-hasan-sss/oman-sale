import { SiteFooter } from '@/components/home/site-footer';
import { TourismDestinationDetailsPage } from '@/components/tourism/tourism-destination-details-page';
import { TourismHeader } from '@/components/tourism/tourism-header';

export default function DestinationPage({ params }: { params: { id: string } }) {
  return (
    <div className="site-page-shell bg-slate-50">
      <TourismHeader />
      <TourismDestinationDetailsPage destinationId={params.id} />
      <SiteFooter />
    </div>
  );
}
