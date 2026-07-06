export type BannerAdPrefillInput = {
  listingId: string;
  title: string;
  imageUrl?: string | null;
};

export function buildBannerAdRequestUrl(localizedPath: (path: string) => string, input: BannerAdPrefillInput) {
  const params = new URLSearchParams();
  params.set('linkUrl', `/listing/${input.listingId}`);

  if (input.imageUrl?.trim()) {
    params.set('imageUrl', input.imageUrl.trim());
  }

  const title = input.title.trim();
  if (title) {
    params.set('textAr', title);
    params.set('textEn', title);
  }

  return `${localizedPath('/banner-ad')}?${params.toString()}`;
}

export function readBannerAdPrefill(searchParams: URLSearchParams) {
  return {
    imageUrl: searchParams.get('imageUrl')?.trim() ?? '',
    linkUrl: searchParams.get('linkUrl')?.trim() ?? '',
    textAr: searchParams.get('textAr')?.trim() ?? '',
    textEn: searchParams.get('textEn')?.trim() ?? ''
  };
}

export function hasBannerAdPrefill(searchParams: URLSearchParams) {
  const prefill = readBannerAdPrefill(searchParams);
  return Boolean(prefill.imageUrl || prefill.linkUrl || prefill.textAr || prefill.textEn);
}
