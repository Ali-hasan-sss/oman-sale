import { tourismRepository } from '../tourism/tourism.repository';
import type { AssistantAuthContext } from './assistant-auth-actions';
import type { AssistantAction, GetTourismInfoToolArgs } from './assistant.types';
import type { AssistantLocale } from './assistant.validation';

type TourismHighlight = string;

function asStringArray(value: unknown): TourismHighlight[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function matchesQuery(
  destination: {
    slug: string;
    titleAr: string;
    titleEn: string;
    aboutAr: string;
    aboutEn: string;
    highlightsAr: unknown;
    highlightsEn: unknown;
    addressAr: string;
    addressEn: string;
  },
  query: string
) {
  const haystack = [
    destination.slug,
    destination.titleAr,
    destination.titleEn,
    destination.aboutAr,
    destination.aboutEn,
    destination.addressAr,
    destination.addressEn,
    ...asStringArray(destination.highlightsAr),
    ...asStringArray(destination.highlightsEn)
  ]
    .join(' ')
    .toLowerCase();

  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  if (tokens.length === 0) return true;
  return tokens.some((token) => haystack.includes(token));
}

export async function executeGetTourismInfo(
  args: GetTourismInfoToolArgs,
  auth: AssistantAuthContext
): Promise<{
  summary: string;
  count: number;
  destinations: Array<{
    slug: string;
    title: string;
    about: string;
    highlights: string[];
    activities: string[];
    bestTime: string;
    address: string;
    rating: string;
    ratingLabel: string;
    detailPath: string;
  }>;
  actions: AssistantAction[];
}> {
  const locale = auth.locale;
  const all = await tourismRepository.list(false);
  const slug = args.slug?.trim().toLowerCase();
  const query = args.q?.trim();

  let filtered = all;

  if (slug) {
    filtered = all.filter((item) => item.slug.toLowerCase() === slug);
  } else if (query) {
    filtered = all.filter((item) => matchesQuery(item, query));
  }

  const destinations = filtered.map((item) => ({
    slug: item.slug,
    title: locale === 'ar' ? item.titleAr : item.titleEn,
    about: locale === 'ar' ? item.aboutAr : item.aboutEn,
    highlights: asStringArray(locale === 'ar' ? item.highlightsAr : item.highlightsEn),
    activities: asStringArray(locale === 'ar' ? item.activitiesAr : item.activitiesEn),
    bestTime: locale === 'ar' ? item.bestTimeAr : item.bestTimeEn,
    address: locale === 'ar' ? item.addressAr : item.addressEn,
    rating: item.rating,
    ratingLabel: locale === 'ar' ? item.ratingLabelAr : item.ratingLabelEn,
    detailPath: `/${locale}/destination/${item.slug}`
  }));

  const summary =
    destinations.length === 0
      ? locale === 'ar'
        ? 'لم أجد معلماً سياحياً مطابقاً في صفحة المعالم على Oman Sale.'
        : 'No matching tourism landmark was found on Oman Sale.'
      : destinations.length === 1
        ? locale === 'ar'
          ? `وجدت معلماً واحداً على المنصة: ${destinations[0]!.title}`
          : `Found one landmark on the platform: ${destinations[0]!.title}`
        : locale === 'ar'
          ? `وجدت ${destinations.length} معالم سياحية على المنصة.`
          : `Found ${destinations.length} tourism landmarks on the platform.`;

  const actions: AssistantAction[] = [
    {
      label: locale === 'ar' ? 'صفحة المعالم السياحية' : 'Tourism landmarks',
      href: `/${locale}/tourism`,
      variant: destinations.length === 1 ? 'default' : 'primary'
    }
  ];

  if (destinations.length === 1) {
    actions.unshift({
      label: locale === 'ar' ? 'عرض المعلم' : 'View landmark',
      href: destinations[0]!.detailPath,
      variant: 'primary'
    });
  }

  return {
    summary,
    count: destinations.length,
    destinations,
    actions
  };
}
