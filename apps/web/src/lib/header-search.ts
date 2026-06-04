export type HeaderSearchMode = 'global' | 'listings' | 'stores';

const localePrefixPattern = /^\/(ar|en)(?=\/|$)/;

export function stripLocalePrefix(pathname: string) {
  return pathname.replace(localePrefixPattern, '') || '/';
}

export function getHeaderSearchMode(pathname: string): HeaderSearchMode {
  const path = stripLocalePrefix(pathname);

  if (path === '/stores') {
    return 'stores';
  }

  if (path.startsWith('/stores/')) {
    return 'global';
  }

  if (path === '/all-listings' || path.startsWith('/category/')) {
    return 'listings';
  }

  return 'global';
}

export function getHeaderSearchPlaceholder(
  mode: HeaderSearchMode,
  messages: {
    global: string;
    listings: string;
    stores: string;
  }
) {
  if (mode === 'stores') return messages.stores;
  if (mode === 'listings') return messages.listings;
  return messages.global;
}

export function buildHeaderSearchUrl(
  mode: HeaderSearchMode,
  query: string,
  localizedPath: (href: string) => string,
  pathname: string
) {
  const trimmed = query.trim();
  const path = stripLocalePrefix(pathname);

  if (mode === 'stores') {
    return trimmed ? `${localizedPath('/stores')}?q=${encodeURIComponent(trimmed)}` : localizedPath('/stores');
  }

  if (mode === 'listings') {
    if (path.startsWith('/category/')) {
      const slug = path.split('/category/')[1]?.split('/')[0]?.split('?')[0];
      if (slug) {
        return trimmed
          ? `${localizedPath(`/category/${slug}`)}?q=${encodeURIComponent(trimmed)}`
          : localizedPath(`/category/${slug}`);
      }
    }
    return trimmed
      ? `${localizedPath('/all-listings')}?q=${encodeURIComponent(trimmed)}`
      : localizedPath('/all-listings');
  }

  return trimmed ? `${localizedPath('/search')}?q=${encodeURIComponent(trimmed)}` : localizedPath('/search');
}
