import { getListingCoverMedia, getListingThumbnailMedia, isListingVideo } from '@/lib/listing-media';
import { resolveMediaUrl } from '@/lib/media-url';

const fallbackAdImage = '/logo.png';

export function AdminAdMediaThumb({
  images,
  alt
}: {
  images?: Array<{ imageUrl: string; mediaType?: string }>;
  alt: string;
}) {
  const thumb = getListingThumbnailMedia(images);
  const src = thumb?.imageUrl ? resolveMediaUrl(thumb.imageUrl) : '';

  if (!thumb || isListingVideo(thumb) || !src || src.startsWith('media:')) {
    return <img src={fallbackAdImage} alt={alt} className="h-11 w-11 shrink-0 rounded-xl object-contain bg-slate-50 p-1" />;
  }

  return <img src={src} alt={alt} className="h-11 w-11 shrink-0 rounded-xl object-cover" />;
}

export function AdminAdMediaPreview({
  images,
  alt,
  className
}: {
  images?: Array<{ imageUrl: string; mediaType?: string }>;
  alt: string;
  className?: string;
}) {
  const cover = getListingCoverMedia(images);
  const src = cover?.imageUrl ? resolveMediaUrl(cover.imageUrl) : '';

  if (!src || src.startsWith('media:')) {
    return <img src={fallbackAdImage} alt={alt} className={`object-contain bg-slate-50 p-8 ${className ?? ''}`} />;
  }

  if (isListingVideo(cover)) {
    return <video src={src} controls playsInline preload="metadata" className={className} />;
  }

  return <img src={src} alt={alt} className={className} />;
}
