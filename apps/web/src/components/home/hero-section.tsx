'use client';

import { ChevronLeft, ChevronRight, Globe, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type HeroSlide = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonLink: string;
};

const fallbackImages = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&h=900&fit=crop'
];

const resolveHeroHref = (link: string, localizedPath: (path: string) => string) => {
  if (/^https?:\/\//i.test(link)) return link;
  const path = link.startsWith('/') ? link : `/${link}`;
  return localizedPath(path);
};

export function HeroSection() {
  const { locale, localizedPath, m, toggleLocale } = useI18n();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

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
        if (!cancelled && response.data.data.length > 0) {
          setSlides(response.data.data);
          setActiveSlide(0);
        } else if (!cancelled) {
          setSlides(localeSlides);
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

  const displaySlides = slides.length > 0 ? slides : localeSlides;
  const currentSlide = displaySlides[activeSlide] ?? displaySlides[0]!;

  useEffect(() => {
    if (displaySlides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % displaySlides.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [displaySlides.length]);

  const goToPrevious = () => {
    setActiveSlide((current) => (current === 0 ? displaySlides.length - 1 : current - 1));
  };

  const goToNext = () => {
    setActiveSlide((current) => (current + 1) % displaySlides.length);
  };

  return (
    <section className="group relative flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden">
      {displaySlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            activeSlide === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img src={slide.imageUrl} alt={slide.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60" />
        </div>
      ))}

      <header className="relative z-20 shrink-0">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4">
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 sm:gap-4">
            <Link href={localizedPath('/')} className="flex items-center gap-2 sm:gap-3">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/95 shadow-lg sm:h-16 sm:w-16">
                <img src="/logo.png" alt="Oman Sale" className="h-full w-full object-contain p-1.5" />
              </span>
              <span className="hidden text-xl font-black text-white drop-shadow md:block md:text-2xl">
                Oman Sale
              </span>
            </Link>

            <MobileNavMenu variant="hero" />
            <nav className="hidden items-center gap-3 lg:flex">
              <button
                onClick={toggleLocale}
                className="flex items-center gap-2 rounded-lg border border-white/70 bg-white/90 px-3 py-2 text-sm shadow-lg transition hover:bg-white"
              >
                <Globe size={18} />
                <span>{m.common.languageSwitch}</span>
              </button>
              <ChatNavLink className="rounded-lg border border-white/70 bg-white/90 px-4 py-2 shadow-lg transition hover:bg-white" />
              <Link className="rounded-lg border border-white/70 bg-white/90 px-4 py-2 shadow-lg transition hover:bg-white" href={localizedPath('/all-listings')}>
                {m.common.allListings}
              </Link>
              <Link className="rounded-lg border border-white/70 bg-white/90 px-4 py-2 shadow-lg transition hover:bg-white" href={localizedPath('/my-listings')}>
                {m.common.myListings}
              </Link>
              <Link className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-lg transition hover:bg-brand-700" href={localizedPath('/add-listing')}>
                {m.common.addListing}
              </Link>
              <HeaderAuthAction loginClassName="rounded-lg border border-white/70 bg-white/90 px-4 py-2 shadow-lg transition hover:bg-white" />
            </nav>
          </div>

          <div className="relative mx-auto max-w-3xl">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="search"
              placeholder={m.home.searchPlaceholder}
              className="w-full rounded-xl border border-white/60 bg-white/95 py-3 pl-4 pr-12 text-sm shadow-lg outline-none backdrop-blur-sm transition focus:ring-2 focus:ring-brand-500 sm:py-4 sm:text-base"
            />
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 pb-16 text-center">
        <div className="max-w-3xl">
          <h1 className="mb-3 text-3xl font-black text-white drop-shadow-lg sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl">
            {currentSlide.title}
          </h1>
          <p className="mb-6 text-base text-white/90 drop-shadow sm:mb-8 sm:text-xl md:text-2xl">
            {currentSlide.subtitle}
          </p>
          <Link
            href={resolveHeroHref(currentSlide.buttonLink, localizedPath)}
            className="inline-flex rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-ink-900 shadow-lg transition hover:scale-105 hover:bg-slate-100 sm:px-8 sm:py-3 sm:text-base"
          >
            {currentSlide.buttonLabel}
          </Link>
        </div>
      </div>

      {displaySlides.length > 1 ? (
        <>
          <button
            aria-label={m.common.previousSlide}
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 z-20 rounded-full bg-white/80 p-2 opacity-0 shadow-lg transition hover:bg-white group-hover:opacity-100"
          >
            <ChevronLeft className="text-ink-900" />
          </button>
          <button
            aria-label={m.common.nextSlide}
            onClick={goToNext}
            className="absolute right-4 top-1/2 z-20 rounded-full bg-white/80 p-2 opacity-0 shadow-lg transition hover:bg-white group-hover:opacity-100"
          >
            <ChevronRight className="text-ink-900" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-6">
            {displaySlides.map((slide, index) => (
              <button
                key={slide.id}
                aria-label={`${m.common.goToSlide} ${slide.title}`}
                onClick={() => setActiveSlide(index)}
                className={`h-3 rounded-full transition-all ${
                  activeSlide === index ? 'w-8 bg-white' : 'w-3 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
