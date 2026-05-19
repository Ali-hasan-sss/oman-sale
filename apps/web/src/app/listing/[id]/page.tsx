import { ListingDetailsPage } from '@/components/listings/listing-details-page';

export default function ListingRoute({ params }: { params: { id: string } }) {
  return <ListingDetailsPage id={params.id} />;
}
