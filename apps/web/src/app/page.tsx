import { CategoriesSection } from '@/components/home/categories-section';
import { HeroBannersSection } from '@/components/home/hero-banners-section';
import { HeroSection } from '@/components/home/hero-section';
import { LatestListingsSection } from '@/components/home/latest-listings-section';
import { SiteFooter } from '@/components/home/site-footer';
import { TourismSection } from '@/components/home/tourism-section';
import { WhyOmanSaleSection } from '@/components/home/why-oman-sale-section';

export default function HomePage() {
  return (
    <div id="top" className="min-h-screen bg-slate-50">
      <HeroSection />
      <HeroBannersSection />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <CategoriesSection />
        <LatestListingsSection />
        <TourismSection />
      </main>
      <WhyOmanSaleSection />
      <SiteFooter />
    </div>
  );
}
