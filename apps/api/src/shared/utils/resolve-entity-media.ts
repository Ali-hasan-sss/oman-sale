import { resolveMediaUrl } from './media-reference';

type ImageRecord = { imageUrl: string };

export function resolveAdMedia<T>(ad: T): T {
  const record = ad as T & { images?: ImageRecord[] };
  if (!record.images?.length) return ad;

  return {
    ...ad,
    images: record.images.map((image) => ({
      ...image,
      imageUrl: resolveMediaUrl(image.imageUrl)
    }))
  };
}

export function resolveAdsMedia<T>(ads: T[]): T[] {
  return ads.map(resolveAdMedia);
}

export function resolveStoreMedia<T>(store: T): T {
  const record = store as T & { logoUrl?: string | null; coverUrl?: string | null };

  return {
    ...store,
    logoUrl: record.logoUrl ? resolveMediaUrl(record.logoUrl) : record.logoUrl,
    coverUrl: record.coverUrl ? resolveMediaUrl(record.coverUrl) : record.coverUrl
  };
}

export function resolveUserMedia<T>(user: T): T {
  const record = user as T & { avatar?: string | null };

  return {
    ...user,
    avatar: record.avatar ? resolveMediaUrl(record.avatar) : record.avatar
  };
}

function normalizeGalleryImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export function resolveTourismDestinationMedia<T>(destination: T): T {
  const record = destination as T & { imageUrl: string; galleryImages?: unknown };

  return {
    ...destination,
    imageUrl: resolveMediaUrl(record.imageUrl),
    galleryImages: normalizeGalleryImages(record.galleryImages).map(resolveMediaUrl)
  };
}
