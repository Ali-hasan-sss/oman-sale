import { ArticleDetailsPage } from '@/components/articles/article-details-page';

type ArticlePageProps = {
  params: { slug: string };
};

export default function ArticlePage({ params }: ArticlePageProps) {
  return <ArticleDetailsPage slug={params.slug} />;
}
