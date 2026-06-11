export type HeaderSearchMode = 'global' | 'listings' | 'stores' | 'news';

export type GlobalSearchScope = 'all' | 'listings' | 'articles' | 'tourism' | 'stores';

export type SearchSuggestionType = 'listing' | 'category' | 'article' | 'tourism' | 'store';

export type SearchSuggestion = {
  type: SearchSuggestionType;
  id: string;
  slug?: string;
  label: string;
};

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

  if (path === '/news' || path === '/articles') {
    return 'news';
  }

  return 'global';
}

export function getHeaderSearchPlaceholder(
  mode: HeaderSearchMode,
  messages: {
    global: string;
    listings: string;
    stores: string;
    news: string;
  }
) {
  if (mode === 'stores') return messages.stores;
  if (mode === 'listings') return messages.listings;
  if (mode === 'news') return messages.news;
  return messages.global;
}

export function buildHeaderSearchUrl(
  mode: HeaderSearchMode,
  query: string,
  localizedPath: (href: string) => string,
  pathname: string,
  searchParams?: URLSearchParams
) {
  const trimmed = query.trim();
  const path = stripLocalePrefix(pathname);

  if (mode === 'news') {
    const params = new URLSearchParams();
    const category = searchParams?.get('category');
    if (trimmed) params.set('q', trimmed);
    if (category) params.set('category', category);
    const queryString = params.toString();
    return queryString ? `${localizedPath('/news')}?${queryString}` : localizedPath('/news');
  }

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

  return buildScopedSearchUrl('all', trimmed, localizedPath);
}

export function buildScopedSearchUrl(
  scope: GlobalSearchScope,
  query: string,
  localizedPath: (href: string) => string
) {
  const trimmed = query.trim();
  const encoded = encodeURIComponent(trimmed);

  if (scope === 'listings') {
    return trimmed ? `${localizedPath('/all-listings')}?q=${encoded}` : localizedPath('/all-listings');
  }
  if (scope === 'articles') {
    return trimmed ? `${localizedPath('/news')}?q=${encoded}` : localizedPath('/news');
  }
  if (scope === 'tourism') {
    return trimmed ? `${localizedPath('/tourism')}?q=${encoded}` : localizedPath('/tourism');
  }
  if (scope === 'stores') {
    return trimmed ? `${localizedPath('/stores')}?q=${encoded}` : localizedPath('/stores');
  }
  return trimmed ? `${localizedPath('/search')}?q=${encoded}` : localizedPath('/search');
}

export function buildSuggestionUrl(suggestion: SearchSuggestion, localizedPath: (href: string) => string) {
  switch (suggestion.type) {
    case 'listing':
      return localizedPath(`/listing/${suggestion.id}`);
    case 'category':
      return localizedPath(`/category/${suggestion.slug ?? suggestion.id}`);
    case 'article':
      return localizedPath(`/news/${suggestion.slug ?? suggestion.id}`);
    case 'tourism':
      return localizedPath(`/destination/${suggestion.slug ?? suggestion.id}`);
    case 'store':
      return localizedPath(`/stores/${suggestion.slug ?? suggestion.id}`);
    default:
      return localizedPath('/search');
  }
}
