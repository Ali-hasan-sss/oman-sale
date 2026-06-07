import type { AssistantLocale } from './assistant.validation';

/** Tokens that route intent to a category — excluded from the browse `q` param. */
const CATEGORY_INTENT_TOKENS = new Set([
  'فرصة',
  'فرص',
  'عمل',
  'وظيفة',
  'وظائف',
  'توظيف',
  'job',
  'jobs',
  'employment',
  'opportunity',
  'opportunities',
  'vacancy',
  'vacancies',
  'hiring',
  'hire',
  'position',
  'positions',
  'role',
  'roles',
  'career',
  'careers',
  'work',
  'opening',
  'openings',
  'مطلوب',
  'required',
  'needed',
  'لديكم',
  'لدينا',
  'عندكم',
  'عندنا',
  'company',
  'your',
  'our',
  'have',
  'available',
  'باحث',
  'باحثين',
  'seeking',
  'seeker',
  'seekers'
]);

/** Token hints → default category slug when results are unavailable. */
const TOKEN_CATEGORY_HINTS: Array<{ slug: string; tokens: string[] }> = [
  { slug: 'job-seekers', tokens: ['باحث', 'باحثين', 'seeking', 'seeker', 'seekers'] },
  { slug: 'jobs', tokens: ['وظيفة', 'وظائف', 'فرصة', 'فرص', 'job', 'jobs', 'vacancy', 'hiring', 'hire', 'توظيف', 'مطلوب'] },
  { slug: 'cars', tokens: ['سيارة', 'سيارات', 'car', 'cars', 'toyota', 'camry', 'nissan', 'vehicle'] },
  { slug: 'computers-laptops', tokens: ['laptop', 'laptops', 'macbook', 'notebook', 'لابتوب', 'حاسوب', 'كمبيوتر', 'computer'] },
  { slug: 'mobiles-tablets', tokens: ['iphone', 'mobile', 'phone', 'jوال', 'موبايل', 'آيفون', 'samsung'] },
  { slug: 'real-estate-sale', tokens: ['شقة', 'فيلا', 'apartment', 'villa', 'property', 'عقار'] }
];

type CategoryLike = { slug: string; parentId?: string | null } | null | undefined;

type ListingLike = { category?: CategoryLike };

export function refineBrowseQuery(primaryTokens: string[]): string {
  const keywords = primaryTokens.filter((token) => !CATEGORY_INTENT_TOKENS.has(token));
  if (keywords.length > 0) return keywords.join(' ');

  const fallback = primaryTokens.find((token) => token.length >= 3);
  return fallback ?? primaryTokens[0] ?? '';
}

export function inferCategorySlugFromTokens(primaryTokens: string[]): string | undefined {
  for (const hint of TOKEN_CATEGORY_HINTS) {
    if (primaryTokens.some((token) => hint.tokens.includes(token))) {
      return hint.slug;
    }
  }
  return undefined;
}

export function inferCategorySlugFromResults<T extends ListingLike>(items: T[], primaryTokens: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const item of items) {
    const slug = item.category?.slug;
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  if (counts.size > 0) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  return inferCategorySlugFromTokens(primaryTokens);
}

export function buildListingsBrowsePath(
  locale: AssistantLocale,
  params: {
    categorySlug?: string;
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
  }
) {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set('q', params.q.trim());
  if (params.minPrice !== undefined) search.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) search.set('maxPrice', String(params.maxPrice));
  if (params.city?.trim()) search.set('city', params.city.trim());

  const query = search.toString();
  const base = params.categorySlug
    ? `/${locale}/category/${encodeURIComponent(params.categorySlug)}`
    : `/${locale}/all-listings`;

  return query ? `${base}?${query}` : base;
}

export function buildStoresBrowsePath(
  locale: AssistantLocale,
  params: {
    q?: string;
    storeTypeId?: string;
    city?: string;
  }
) {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set('q', params.q.trim());
  if (params.storeTypeId?.trim()) search.set('storeTypeId', params.storeTypeId.trim());
  if (params.city?.trim()) search.set('city', params.city.trim());

  const query = search.toString();
  const base = `/${locale}/stores`;
  return query ? `${base}?${query}` : base;
}
