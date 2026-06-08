'use client';

import { Play } from 'lucide-react';

import { resolveMediaUrl } from '@/lib/media-url';
import { getListingCoverMedia, isListingVideo, type ListingMediaItem } from '@/lib/listing-media';

type ListingMediaCoverProps = {
  items?: ListingMediaItem[];
  alt: string;
  fallbackSrc: string;
  className?: string;
  imageClassName?: string;
  showVideoBadge?: boolean;
  compact?: boolean;
};

export function ListingMediaCover({
  items,
  alt,
  fallbackSrc,
  className = '',
  imageClassName = '',
  showVideoBadge = true,
  compact = false
}: ListingMediaCoverProps) {
  const cover = getListingCoverMedia(items);
  const src = cover ? resolveMediaUrl(cover.imageUrl) : fallbackSrc;
  const hasMedia = Boolean(cover);
  const isVideo = isListingVideo(cover);

  if (isVideo && src) {
    return (
      <div className={`relative ${className}`}>
        <video
          src={src}
          muted
          playsInline
          loop
          preload="metadata"
          className={imageClassName}
          aria-label={alt}
        />
        {showVideoBadge ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
            <span
              className={`flex items-center justify-center rounded-full bg-black/55 text-white ${
                compact ? 'h-5 w-5' : 'h-12 w-12'
              }`}
            >
              <Play size={compact ? 10 : 22} className="ms-0.5" fill="currentColor" />
            </span>
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${imageClassName} ${hasMedia ? 'object-cover' : 'object-contain p-8'}`}
    />
  );
}
