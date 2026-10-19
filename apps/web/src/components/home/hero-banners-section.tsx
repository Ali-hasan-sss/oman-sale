'use client';

import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { HeroBannersSkeleton } from '@/components/home/home-section-skeletons';
import { api } from '@/lib/api';
import { bannerPlacementCopy, type BannerPlacement } from '@/lib/banner-placements';
import { useI18n } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media-url';

type HeroBanner = {
  id: string;
  sortOrder: number;
  imageUrl: string;
  text?: string | null;
  linkUrl: string;
};

const INTERVAL_MS = 3500;

const buildLoopBanners = (banners: HeroBanner[]) => {
  if (banners.length <= 1) return banners;
  return [banners[banners.length - 1]!, ...banners, banners[0]!];
};

const loopIndexToReal = (loopIndex: number, count: number) => {
  if (count <= 1) return 0;
  if (loopIndex === 0) return count - 1;
  if (loopIndex === count + 1) return 0;
  return loopIndex - 1;
};

const resolveBannerHref = (link: string, localizedPath: (path: string) => string) => {
  const trimmed = link.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return localizedPath(path);
};

const isExternalLink = (link: string) => {
  const trimmed = link.trim();
  return /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed);
};

type AdBannerSlotProps = {
  placement?: BannerPlacement;
  variant?: 'featured' | 'embedded' | 'inline';
};

export function AdBannerSlot({ placement = 'HOME_BELOW_HERO', variant = 'featured' }: AdBannerSlotProps) {
  const { locale, localizedPath } = useI18n();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loopIndex, setLoopIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const isAdjustingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const copy = bannerPlacementCopy[placement][locale];
  const title = copy.title;
  const subtitle = copy.subtitle;
  const showHeading = variant !== 'inline';
  const advertiseHref = localizedPath(`/banner-ad?placement=${placement}`);
  const advertiseLabel = locale === 'en' ? 'Advertise in this banner' : 'أعلن في هذا البنر';
  const advertiseHint =
    locale === 'en'
      ? 'Submit your banner ad, pay by duration, and publish after admin approval.'
      : 'ارسل إعلانك، ادفع حسب المدة، ويُنشر بعد موافقة الإدارة.';

  const loopBanners = useMemo(() => buildLoopBanners(banners), [banners]);
  const hasLoop = banners.length > 1;
  const activeIndex = hasLoop ? loopIndexToReal(loopIndex, banners.length) : 0;

  const clearAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    clearAutoPlay();
    if (!hasLoop) return;

    timerRef.current = setInterval(() => {
      setLoopIndex((current) => current + 1);
    }, INTERVAL_MS);
  }, [clearAutoPlay, hasLoop]);

  useEffect(() => {
    let cancelled = false;

    const loadBanners = async () => {
      if (!cancelled) setIsLoading(true);
      try {
        const response = await api.get<{ data: HeroBanner[] }>('/hero/banners', {
          params: { locale, placement }
        });
        if (!cancelled) {
          setBanners(response.data.data);
          setLoopIndex(0);
        }
      } catch {
        if (!cancelled) setBanners([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadBanners();

    return () => {
      cancelled = true;
    };
  }, [locale, placement]);

  useEffect(() => {
    if (!hasLoop) {
      clearAutoPlay();
      return;
    }
    setAnimate(false);
    setLoopIndex(1);
    requestAnimationFrame(() => setAnimate(true));
    startAutoPlay();
    return clearAutoPlay;
  }, [hasLoop, banners.length, startAutoPlay, clearAutoPlay]);

  const handleTransitionEnd = () => {
    if (!hasLoop || isAdjustingRef.current) return;

    if (loopIndex === 0) {
      isAdjustingRef.current = true;
      setAnimate(false);
      setLoopIndex(banners.length);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          isAdjustingRef.current = false;
        });
      });
      startAutoPlay();
      return;
    }

    if (loopIndex === loopBanners.length - 1) {
      isAdjustingRef.current = true;
      setAnimate(false);
      setLoopIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          isAdjustingRef.current = false;
        });
      });
      startAutoPlay();
      return;
    }

    startAutoPlay();
  };

  const goToSlide = (realIndex: number) => {
    if (!hasLoop) return;
    setLoopIndex(realIndex + 1);
    startAutoPlay();
  };

  const sectionClass =
    variant === 'featured' ? 'bg-slate-50 px-4 pt-12 md:pt-16' : variant === 'embedded' ? 'py-8 md:py-10' : 'mb-8';
  const frameClass = 'mx-auto w-full max-w-[1010px]';

  if (isLoading) {
    if (variant === 'featured') return <HeroBannersSkeleton />;
    return (
      <section className={sectionClass}>
        <div className={`${frameClass} overflow-hidden rounded-2xl ring-1 ring-slate-200`}>
          <div className="ad-banner-frame animate-pulse bg-slate-200" />
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    return (
      <section className={sectionClass}>
        <div className={`${frameClass} text-center`}>
          {showHeading ? (
            <>
              <h2 className="text-2xl font-black text-slate-900 md:text-3xl">{title}</h2>
              <p className="mt-2 text-sm text-slate-500 md:text-base">{subtitle}</p>
            </>
          ) : null}
          <Link href={advertiseHref} className={`${showHeading ? 'mt-5' : ''} ad-banner-frame ad-banner-empty overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200`}>
            <span className="px-4 text-center text-base font-black sm:text-2xl">{advertiseLabel}</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      {showHeading ? (
        <div className={`${frameClass} mb-5 text-center`}>
          <h2 className="text-2xl font-black text-slate-900 md:text-3xl">{title}</h2>
          <p className="mt-2 text-sm text-slate-500 md:text-base">{subtitle}</p>
        </div>
      ) : null}

      <div className={`relative ${frameClass}`}>
        <div dir="ltr" className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div
            className={`flex ${animate ? 'transition-transform duration-500 ease-out' : ''}`}
            style={{ transform: `translateX(-${loopIndex * 100}%)` }}
            onTransitionEnd={(event) => {
              if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
              handleTransitionEnd();
            }}
          >
            {loopBanners.map((banner, index) => {
              const href = resolveBannerHref(banner.linkUrl, localizedPath);
              const external = isExternalLink(banner.linkUrl);

              return (
                <a
                  key={`${banner.id}-${index}`}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="relative block w-full shrink-0 grow-0"
                >
                  <img
                    src={resolveMediaUrl(banner.imageUrl)}
                    alt={banner.text ?? 'Advertisement'}
                    className="ad-banner-frame cursor-pointer object-cover"
                    loading={index === loopIndex ? 'eager' : 'lazy'}
                  />
                  {banner.text ? (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white">
                      <p className="text-sm font-bold drop-shadow sm:text-base">{banner.text}</p>
                    </div>
                  ) : null}
                </a>
              );
            })}
          </div>
        </div>

        {hasLoop ? (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`${locale === 'en' ? 'Go to banner' : 'انتقل إلى البنر'} ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  activeIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className={`${frameClass} mt-6 text-center`}>
        <Link
          href={advertiseHref}
          className="inline-flex items-center gap-2 rounded-full border border-brick-400 bg-transparent px-6 py-3 text-sm font-bold text-brick-500 transition hover:bg-brick-50"
        >
          <Megaphone size={18} />
          <span>{advertiseLabel}</span>
        </Link>
        <p className="mt-2 text-xs text-slate-500">{advertiseHint}</p>
      </div>
    </section>
  );
}

export function HeroBannersSection() {
  return <AdBannerSlot placement="HOME_BELOW_HERO" variant="featured" />;
}
