'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

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

export function HeroBannersSection() {
  const { locale, localizedPath } = useI18n();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loopIndex, setLoopIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const isAdjustingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const title = locale === 'en' ? 'Featured Offers' : 'عروض مميزة';
  const subtitle =
    locale === 'en'
      ? 'Discover highlighted deals and announcements selected for you.'
      : 'اكتشف عروضاً وإعلانات مختارة بعناية لتناسب اهتماماتك.';

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
      try {
        const response = await api.get<{ data: HeroBanner[] }>('/hero/banners', {
          params: { locale }
        });
        if (!cancelled) {
          setBanners(response.data.data);
          setLoopIndex(0);
        }
      } catch {
        if (!cancelled) setBanners([]);
      }
    };

    void loadBanners();

    return () => {
      cancelled = true;
    };
  }, [locale]);

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

  if (banners.length === 0) return null;

  return (
    <section className="bg-slate-50 px-4 pt-12 md:pt-16">
      <div className="mx-auto mb-5 max-w-[1010px] text-center">
        <h2 className="text-2xl font-black text-slate-900 md:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-slate-500 md:text-base">{subtitle}</p>
      </div>

      <div className="relative mx-auto max-w-[1010px]">
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
                    src={banner.imageUrl}
                    alt={banner.text ?? 'Advertisement'}
                    className="aspect-[990/250] w-full cursor-pointer object-cover"
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
    </section>
  );
}
