import { ArticlesSection } from '@/components/articles/articles-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { CategoryBar } from '@/components/home/category-bar';
import { CreateStoreBanner } from '@/components/home/create-store-banner';
import { HeroBannersSection } from '@/components/home/hero-banners-section';
import { HeroSection } from '@/components/home/hero-section';
import { HomeScrollRestoration } from '@/components/home/home-scroll-restoration';
import { LatestListingsSection } from '@/components/home/latest-listings-section';
import { SiteFooter } from '@/components/home/site-footer';
import { TourismSection } from '@/components/home/tourism-section';
import { WhyOmanSaleSection } from '@/components/home/why-oman-sale-section';

export default function HomePage() {
  return (
    <HomeScrollRestoration>
      <div id="top" className="site-page-shell bg-slate-50">
        <HeroSection />
        <CategoryBar />
        <HeroBannersSection />
        <CreateStoreBanner />
        <main className="site-container site-page-main min-w-0">
          <CategoriesSection />
          <LatestListingsSection />
          <ArticlesSection />
          <TourismSection />
        </main>
        <WhyOmanSaleSection />
        <SiteFooter />
      </div>
    </HomeScrollRestoration>
  );
}
