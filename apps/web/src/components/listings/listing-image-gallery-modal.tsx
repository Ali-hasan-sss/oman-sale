'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ListingImageGalleryModalProps = {
  images: string[];
  initialIndex?: number;
  title?: string;
  imageLabel: string;
  dir?: 'rtl' | 'ltr';
  onClose: (finalIndex?: number) => void;
};

export function ListingImageGalleryModal({
  images,
  initialIndex = 0,
  title,
  imageLabel,
  dir = 'ltr',
  onClose
}: ListingImageGalleryModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((current) => (current > 0 ? current - 1 : images.length - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current < images.length - 1 ? current + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(activeIndex);
      if (event.key === 'ArrowLeft') (dir === 'rtl' ? goNext : goPrev)();
      if (event.key === 'ArrowRight') (dir === 'rtl' ? goPrev : goNext)();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeIndex, dir, goNext, goPrev, onClose]);

  if (!mounted || images.length === 0) return null;

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col bg-black" dir={dir} role="dialog" aria-modal="true">
      <div className="flex items-center gap-3 bg-black/50 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => onClose(activeIndex)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        <div className="min-w-0 flex-1">
          {title ? <p className="truncate text-sm font-bold text-white">{title}</p> : null}
          <p className="text-sm text-white/70">
            {imageLabel} {activeIndex + 1} / {images.length}
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <img
          src={images[activeIndex]}
          alt=""
          className="max-h-[calc(100vh-8rem)] max-w-full object-contain px-4"
        />

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute start-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 sm:start-6"
              aria-label="Previous image"
            >
              <PrevIcon size={28} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute end-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 sm:end-6"
              aria-label="Next image"
            >
              <NextIcon size={28} />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex justify-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition ${index === activeIndex ? 'w-6 bg-green-500' : 'w-2 bg-white/35'}`}
              aria-label={`Image ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>,
    document.body
  );
}
