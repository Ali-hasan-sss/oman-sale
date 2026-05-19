import { AllListingsPage } from '@/components/listings/all-listings-page';

export default function CategoryListingsRoute({ params }: { params: { slug: string } }) {
  return <AllListingsPage categorySlug={params.slug} />;
}
