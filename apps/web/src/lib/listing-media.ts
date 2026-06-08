export type ListingMediaItem = {
  imageUrl: string;
  mediaType?: 'IMAGE' | 'VIDEO' | string;
};

const videoUrlPattern = /\.(mp4|webm|mov)(\?|#|$)/i;

export function isListingVideo(item?: ListingMediaItem | null): boolean {
  if (!item) return false;
  if (item.mediaType === 'VIDEO') return true;
  return videoUrlPattern.test(item.imageUrl);
}

export function sortListingMedia(items: ListingMediaItem[] = []): ListingMediaItem[] {
  return [...items].sort((left, right) => {
    const leftIsVideo = isListingVideo(left);
    const rightIsVideo = isListingVideo(right);
    if (leftIsVideo && !rightIsVideo) return -1;
    if (rightIsVideo && !leftIsVideo) return 1;
    return 0;
  });
}

export function getListingCoverMedia(items?: ListingMediaItem[]): ListingMediaItem | null {
  if (!items?.length) return null;
  return sortListingMedia(items)[0] ?? null;
}

export function getListingGalleryMedia(items?: ListingMediaItem[]): ListingMediaItem[] {
  if (!items?.length) return [];
  return sortListingMedia(items);
}

export function getListingThumbnailMedia(items?: ListingMediaItem[]): ListingMediaItem | null {
  if (!items?.length) return null;
  return items.find((item) => !isListingVideo(item)) ?? null;
}
