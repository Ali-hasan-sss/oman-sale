import { StorePublicPage } from '@/components/stores/store-public-page';

type StorePublicRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function StorePublicRoute({ params }: StorePublicRouteProps) {
  const { slug } = await params;
  return <StorePublicPage slug={slug} />;
}
