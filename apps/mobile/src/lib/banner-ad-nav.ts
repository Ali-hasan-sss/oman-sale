export type BannerAdTarget = {
  placement?: string;
  linkUrl?: string;
  imageUrl?: string | null;
  textAr?: string;
  textEn?: string;
};

type BannerAdOpener = (target: BannerAdTarget) => void;

let opener: BannerAdOpener | null = null;

export function registerBannerAdOpener(next: BannerAdOpener | null) {
  opener = next;
}

export function requestBannerAd(target: BannerAdTarget = {}) {
  opener?.(target);
}
