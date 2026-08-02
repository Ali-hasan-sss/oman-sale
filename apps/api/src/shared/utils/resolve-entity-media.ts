import { resolveMediaUrl } from './media-reference';
import { isTrustBadgeApproved, mapTrustBadgePublic } from '../trust-badge/trust-badge.utils';

type ImageRecord = { imageUrl: string };

export function resolveAdMedia<T>(ad: T): T {
  const record = ad as T & {
    images?: ImageRecord[];
    store?: {
      logoUrl?: string | null;
      trustBadgeStatus?: string | null;
    } | null;
    user?: {
      avatar?: string | null;
      trustBadgeStatus?: string | null;
    } | null;
  };

  const withMedia = !record.images?.length
    ? ad
    : {
        ...ad,
        images: record.images.map((image) => ({
          ...image,
          imageUrl: resolveMediaUrl(image.imageUrl)
        }))
      };

  const trustBadgeApproved = record.store
    ? isTrustBadgeApproved(record.store.trustBadgeStatus as never)
    : isTrustBadgeApproved(record.user?.trustBadgeStatus as never);

  const store = record.store
    ? {
        ...record.store,
        logoUrl: record.store.logoUrl ? resolveMediaUrl(record.store.logoUrl) : record.store.logoUrl,
        ...('trustBadgeStatus' in record.store
          ? mapTrustBadgePublic(record.store.trustBadgeStatus as never)
          : {})
      }
    : record.store;

  const user = record.user
    ? {
        ...record.user,
        avatar: record.user.avatar ? resolveMediaUrl(record.user.avatar) : record.user.avatar
      }
    : record.user;

  return {
    ...withMedia,
    trustBadgeApproved,
    ...(store ? { store } : {}),
    ...(user ? { user } : {})
  } as T;
}

export function resolveAdsMedia<T>(ads: T[]): T[] {
  return ads.map(resolveAdMedia);
}

export function resolveStoreMedia<T>(store: T): T {
  const record = store as T & {
    logoUrl?: string | null;
    coverUrl?: string | null;
    trustBadgeStatus?: string | null;
  };

  return {
    ...store,
    logoUrl: record.logoUrl ? resolveMediaUrl(record.logoUrl) : record.logoUrl,
    coverUrl: record.coverUrl ? resolveMediaUrl(record.coverUrl) : record.coverUrl,
    ...(record.trustBadgeStatus !== undefined
      ? mapTrustBadgePublic(record.trustBadgeStatus as never)
      : {})
  };
}

export function resolveUserMedia<T>(user: T): T {
  const record = user as T & { avatar?: string | null; trustBadgeStatus?: string | null };

  return {
    ...user,
    avatar: record.avatar ? resolveMediaUrl(record.avatar) : record.avatar,
    ...(record.trustBadgeStatus !== undefined
      ? mapTrustBadgePublic(record.trustBadgeStatus as never)
      : {})
  };
}

export function resolveUserTrustDocs<T>(user: T): T {
  const record = user as T & { trustIdentityDocUrl?: string | null };

  if (record.trustIdentityDocUrl === undefined) return user;

  return {
    ...user,
    trustIdentityDocUrl: record.trustIdentityDocUrl ? resolveMediaUrl(record.trustIdentityDocUrl) : null
  };
}

export function resolveStoreTrustDocs<T>(store: T): T {
  const record = store as T & {
    trustCommercialRegDocUrl?: string | null;
    trustOcciDocUrl?: string | null;
    trustSmeDocUrl?: string | null;
    trustOtherDocUrl?: string | null;
  };

  if (
    record.trustCommercialRegDocUrl === undefined &&
    record.trustOcciDocUrl === undefined &&
    record.trustSmeDocUrl === undefined &&
    record.trustOtherDocUrl === undefined
  ) {
    return store;
  }

  return {
    ...store,
    trustCommercialRegDocUrl: record.trustCommercialRegDocUrl
      ? resolveMediaUrl(record.trustCommercialRegDocUrl)
      : record.trustCommercialRegDocUrl ?? null,
    trustOcciDocUrl: record.trustOcciDocUrl ? resolveMediaUrl(record.trustOcciDocUrl) : record.trustOcciDocUrl ?? null,
    trustSmeDocUrl: record.trustSmeDocUrl ? resolveMediaUrl(record.trustSmeDocUrl) : record.trustSmeDocUrl ?? null,
    trustOtherDocUrl: record.trustOtherDocUrl ? resolveMediaUrl(record.trustOtherDocUrl) : record.trustOtherDocUrl ?? null
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

export function resolveArticleMedia<T>(article: T): T {
  const record = article as T & { coverImageUrl: string; galleryImages?: unknown };

  return {
    ...article,
    coverImageUrl: resolveMediaUrl(record.coverImageUrl),
    galleryImages: normalizeGalleryImages(record.galleryImages).map(resolveMediaUrl)
  };
}

export function resolveArticlesMedia<T>(articles: T[]): T[] {
  return articles.map(resolveArticleMedia);
}
