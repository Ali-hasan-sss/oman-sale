'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { OmanMap } from '@/components/home/oman-map';
import { VertexShowcase, type ShowcaseShot } from '@/components/home/vertex-showcase';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media-url';

type HeroSlide = {
  id: string;
  imageUrl: string;
  cardImageUrl?: string | null;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonLink: string;
};

type LatestListing = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  category?: { name?: string; nameAr?: string; nameEn?: string };
  images?: Array<{ imageUrl: string }>;
};

const fallbackImages = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&h=900&fit=crop'
];

/** Portrait fallbacks for the 3D ring, matched to the sample listings in the locale files. */
const fallbackShotImages = [
  'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=900&fit=crop',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=900&fit=crop',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=900&fit=crop',
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=900&fit=crop',
  'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=900&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=900&fit=crop',
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=900&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=900&fit=crop'
];

const resolveHeroHref = (link: string, localizedPath: (path: string) => string) => {
  if (/^https?:\/\//i.test(link)) return link;
  const path = link.startsWith('/') ? link : `/${link}`;
  return localizedPath(path);
};

const formatPrice = (price: LatestListing['price'], currency: string, locale: string) => {
  if (price === null || price === undefined) return '';
  const value = Number(price);
  if (!Number.isFinite(value)) return String(price);
  const unit = currency === 'OMR' ? (locale === 'en' ? 'OMR' : 'ر.ع') : currency;
  return `${value.toLocaleString('en-US')} ${unit}`;
};

const heroCopy = {
  ar: {
    badge: 'منصة الإعلانات الأولى في سلطنة عُمان',
    secondary: 'أضف إعلانك',
    announcement: 'آلاف الإعلانات الموثوقة في كل محافظات السلطنة',
    bannerKicker: 'جديد اليوم',
    bannerCta: 'تصفح الآن'
  },
  en: {
    badge: "Oman's all-in-one listings platform",
    secondary: 'Post an ad',
    announcement: 'Thousands of trusted listings across every governorate',
    bannerKicker: 'Just added',
    bannerCta: 'Explore now'
  }
} as const;

export function HeroSection() {
  const { locale, dir, localizedPath, m } = useI18n();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [listings, setListings] = useState<LatestListing[]>([]);
  const starsA = useRef<HTMLDivElement>(null);
  const starsB = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const copy = heroCopy[locale === 'en' ? 'en' : 'ar'];

  const localeSlides = useMemo<HeroSlide[]>(
    () =>
      m.home.slides.map((slide, index) => ({
        id: `fallback-${index}`,
        imageUrl: fallbackImages[index] ?? fallbackImages[0]!,
        title: slide.title,
        subtitle: slide.subtitle,
        buttonLabel: slide.action,
        buttonLink: '/all-listings'
      })),
    [m.home.slides]
  );

  useEffect(() => {
    let cancelled = false;

    const loadSlides = async () => {
      try {
        const response = await api.get<{ data: HeroSlide[] }>(`/hero/slides`, {
          params: { locale, platform: 'web' }
        });
        if (!cancelled) {
          setSlides(response.data.data.length > 0 ? response.data.data : localeSlides);
          setActiveSlide(0);
        }
      } catch {
        if (!cancelled) {
          setSlides(localeSlides);
          setActiveSlide(0);
        }
      }
    };

    void loadSlides();

    return () => {
      cancelled = true;
    };
  }, [locale, localeSlides]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: { items: LatestListing[] } }>('/ads/latest', { params: { limit: 12 } })
      .then((response) => {
        if (!cancelled) setListings(response.data.data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setListings([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displaySlides = slides.length > 0 ? slides : localeSlides;
  const currentSlide = displaySlides[activeSlide] ?? displaySlides[0]!;

  useEffect(() => {
    if (displaySlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % displaySlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [displaySlides.length]);

  // Oman map: its top is pinned to the badge, and it runs down behind the ring
  // until a little past the top of the browser mock.
  useEffect(() => {
    const section = sectionRef.current;
    const badge = badgeRef.current;
    const map = mapRef.current;
    if (!section || !badge || !map) return undefined;

    const place = () => {
      const base = section.getBoundingClientRect().top;
      const top = badge.getBoundingClientRect().top - base;
      const mock = section.querySelector('.vx-browser');
      const mockTop = mock ? mock.getBoundingClientRect().top - base : section.clientHeight;
      map.style.top = `${Math.round(top)}px`;
      map.style.height = `${Math.max(320, Math.round(mockTop - top + 80))}px`;
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(section);
    window.addEventListener('resize', place);
    const late = window.setTimeout(place, 600);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.clearTimeout(late);
    };
  }, []);

  // Starfield: two 1px nodes whose whole field is one box-shadow list.
  useEffect(() => {
    const field = (count: number, blur: number, min: number, max: number) =>
      Array.from({ length: count }, () => {
        const alpha = (min + Math.random() * (max - min)).toFixed(2);
        return `${(Math.random() * 100).toFixed(2)}vw ${(Math.random() * 100).toFixed(2)}vh ${blur}px 0 rgba(255,255,255,${alpha})`;
      }).join(',');
    if (starsA.current) starsA.current.style.boxShadow = field(150, 0, 0.05, 0.3);
    if (starsB.current) starsB.current.style.boxShadow = field(18, 1.2, 0.35, 0.7);
  }, []);

  // The rotating ring shows the hero slides managed from the admin slider.
  const ringShots = useMemo<ShowcaseShot[]>(
    () =>
      displaySlides.map((slide) => ({
        id: slide.id,
        image: resolveMediaUrl(slide.cardImageUrl || slide.imageUrl),
        title: slide.title,
        price: '',
        category: '',
        place: slide.subtitle,
        href: resolveHeroHref(slide.buttonLink, localizedPath)
      })),
    [displaySlides, localizedPath]
  );

  const shots = useMemo<ShowcaseShot[]>(() => {
    const fromApi = listings
      .filter((listing) => listing.images && listing.images.length > 0)
      .map((listing) => ({
        id: listing.id,
        image: resolveMediaUrl(listing.images![0]!.imageUrl),
        title: listing.title,
        price: formatPrice(listing.price, listing.currency, locale),
        category:
          (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) ?? listing.category?.name ?? '',
        place: listing.city ?? '',
        href: localizedPath(`/listing/${listing.id}`)
      }));
    if (fromApi.length >= 4) return fromApi;

    const samples = (m.home.listings as unknown as string[][]).map(([title, price, place, category], index) => ({
      id: `sample-${index}`,
      image: fallbackShotImages[index % fallbackShotImages.length]!,
      title: title ?? '',
      price: price ?? '',
      category: category ?? '',
      place: place ?? '',
      href: localizedPath('/all-listings')
    }));
    return [...fromApi, ...samples];
  }, [listings, locale, localizedPath, m.home.listings]);

  const ctaHref = resolveHeroHref(currentSlide.buttonLink, localizedPath);

  return (
    <section ref={sectionRef} className="vx-hero vx-light" dir={dir}>
      <div ref={starsA} className="vx-stars" aria-hidden />
      <div ref={starsB} className="vx-stars" aria-hidden />

      <div className="vx-in relative z-40" style={{ ['--d' as string]: '60ms', ['--vx-from' as string]: '-9px' }}>
        <UserSiteHeader variant="hero" sticky={false} />
      </div>

      <div ref={mapRef} className="vx-oman-wrap vx-in" style={{ ['--d' as string]: '300ms', ['--vx-from' as string]: '14px' }}>
        <OmanMap locale={locale === 'en' ? 'en' : 'ar'} />
      </div>

      <div className="vx-copy">
        <div ref={badgeRef} className="vx-badge vx-in" style={{ ['--d' as string]: '270ms', ['--vx-from' as string]: '11px' }}>
          <i aria-hidden>
            <svg viewBox="5 1 14 22" preserveAspectRatio="none">
              <path
                d="M13.9 1.6 5.5 13.6a.7.7 0 0 0 .6 1.1h4.2l-1 7.7a.7.7 0 0 0 1.25.55l8.3-12.1a.7.7 0 0 0-.6-1.1h-4.2l1-7.7a.7.7 0 0 0-1.25-.55Z"
                fill="rgba(16,112,152,.72)"
                stroke="rgba(190,236,255,.6)"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </i>
          <span className="truncate">{copy.badge}</span>
        </div>

        <h1 key={`t-${currentSlide.id}`} className="vx-h1 vx-wipe" style={{ ['--d' as string]: '380ms' }}>
          {currentSlide.title}
        </h1>
        <p key={`s-${currentSlide.id}`} className="vx-sub vx-in" style={{ ['--d' as string]: '620ms' }}>
          {currentSlide.subtitle}
        </p>

        <div className="vx-search vx-in" style={{ ['--d' as string]: '720ms' }}>
          <SiteHeaderSearch variant="hero" />
        </div>

        <div className="vx-cta-row vx-in" style={{ ['--d' as string]: '830ms', ['--vx-from' as string]: '13px' }}>
          <Link href={ctaHref} className="vx-btn vx-btn--lg">
            <span>{currentSlide.buttonLabel}</span>
          </Link>
          <Link href={localizedPath('/add-listing')} className="vx-ghost vx-ghost--lg">
            {copy.secondary}
          </Link>
        </div>

        {displaySlides.length > 1 ? (
          <div className="vx-dots vx-in" style={{ ['--d' as string]: '900ms' }}>
            {displaySlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`${m.common.goToSlide} ${slide.title}`}
                aria-current={activeSlide === index}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <VertexShowcase
        shots={ringShots}
        preview={shots.slice(0, 4)}
        banner={{
          image: resolveMediaUrl(currentSlide.imageUrl),
          kicker: copy.bannerKicker,
          title: currentSlide.title,
          cta: copy.bannerCta,
          href: ctaHref
        }}
        announcement={copy.announcement}
        sectionTitle={m.home.latestListings}
        viewAll={m.common.viewAll}
        viewAllHref={localizedPath('/all-listings')}
        navLinks={[m.common.allListings, m.common.news, m.common.pricing]}
        dir={dir}
      />
    </section>
  );
}
