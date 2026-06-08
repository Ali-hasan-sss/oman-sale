export type HeaderNavButtonRecord = {
  id: string;
  sortOrder: number;
  labelAr: string;
  labelEn: string;
  linkUrl: string;
  isActive: boolean;
};

export type HeaderNavButtonPublic = {
  id: string;
  sortOrder: number;
  label: string;
  linkUrl: string;
};

export function resolveHeaderHref(link: string, localizedPath: (path: string) => string) {
  if (/^https?:\/\//i.test(link)) return link;
  const path = link.startsWith('/') ? link : `/${link}`;
  return localizedPath(path);
}

export function getHeaderButtonLabel(button: HeaderNavButtonRecord, locale: 'ar' | 'en') {
  return locale === 'en' ? button.labelEn : button.labelAr;
}
