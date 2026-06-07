import { Prisma, StoreSubscriptionStatus } from '@prisma/client';

import { omanCities } from '../../shared/constants/oman-cities';
import { prisma } from '../../shared/prisma/client';
import { refineBrowseQuery } from './assistant-browse';
import type { SearchStoresToolArgs } from './assistant.types';

export const ASSISTANT_STORES_LIMIT = 4;

const STORE_STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'in', 'on', 'with', 'or', 'and', 'i', 'want', 'need', 'looking', 'show', 'me', 'find',
  'any', 'some', 'please', 'about', 'from', 'to', 'under', 'over', 'around', 'omr', 'ريال', 'عمان', 'oman', 'sale',
  'أريد', 'أبحث', 'عن', 'في', 'من', 'إلى', 'الى', 'مع', 'أو', 'و', 'هل', 'ما', 'هذا', 'هذه', 'اي', 'أي',
  'متجر', 'متاجر', 'محل', 'محلات', 'معرض', 'معارض', 'shop', 'shops', 'store', 'stores', 'showroom', 'showrooms',
  'dealership', 'dealerships', 'market', 'markets', 'mart', 'marts', 'outlet', 'outlets', 'place', 'places',
  'ورشة', 'ورش', 'workshop', 'workshops', 'garage', 'garages', 'سوبرماركت', 'سوبر', 'ماركت', 'ميني', 'mini',
  'supermarket', 'supermarkets', 'grocery', 'groceries', 'explore', 'browse', 'استكشف', 'استعرض', 'استكشاف',
  'لديكم', 'لدينا', 'عندكم', 'عندنا', 'your', 'our', 'have', 'active', 'نشطة', 'نشط'
]);

const CITY_ALIASES: Record<string, string> = {
  muscat: 'مسقط',
  salalah: 'صلالة',
  sohar: 'صحار',
  nizwa: 'نزوى',
  sur: 'صور',
  'al buraimi': 'البريمي',
  buraimi: 'البريمي',
  rustaq: 'الرستاق',
  seeb: 'السيب',
  'al khuwair': 'الخوير',
  khuwair: 'الخوير',
  qurum: 'القرم'
};

/** Store-type slug hints from user wording (معرض، ورشة، سوبرماركت، …). */
const STORE_TYPE_SLUG_HINTS: Array<{ slug: string; typeTokens: string[]; domainTokens?: string[] }> = [
  {
    slug: 'car-showroom',
    typeTokens: ['معرض', 'معارض', 'showroom', 'showrooms', 'dealership', 'dealerships'],
    domainTokens: ['سيارة', 'سيارات', 'car', 'cars', 'auto', 'vehicle', 'vehicles']
  },
  {
    slug: 'auto-workshop',
    typeTokens: ['ورشة', 'ورش', 'workshop', 'workshops', 'garage', 'garages'],
    domainTokens: ['سيارة', 'سيارات', 'car', 'cars', 'auto']
  },
  {
    slug: 'supermarket',
    typeTokens: ['سوبرماركت', 'supermarket', 'supermarkets', 'ميني', 'mini', 'minimarket', 'minimarkets'],
    domainTokens: []
  },
  {
    slug: 'grocery-store',
    typeTokens: ['غذائية', 'grocery', 'groceries'],
    domainTokens: []
  },
  {
    slug: 'real-estate-office',
    typeTokens: ['عقارية', 'عقار', 'real', 'estate', 'property'],
    domainTokens: ['مكتب', 'مكاتب', 'office', 'offices']
  },
  {
    slug: 'spare-parts',
    typeTokens: ['قطع', 'غيار', 'spare', 'parts'],
    domainTokens: []
  },
  {
    slug: 'electronics-shop',
    typeTokens: ['إلكترونيات', 'الكترونيات', 'electronics', 'electronic'],
    domainTokens: []
  },
  {
    slug: 'mobile-telecom',
    typeTokens: ['موبايل', 'جوال', 'اتصالات', 'mobile', 'telecom', 'phone'],
    domainTokens: []
  },
  {
    slug: 'clothing-store',
    typeTokens: ['ملابس', 'clothing', 'clothes', 'fashion', 'apparel'],
    domainTokens: []
  },
  {
    slug: 'pharmacy',
    typeTokens: ['صيدلية', 'صيدليات', 'pharmacy', 'pharmacies'],
    domainTokens: []
  },
  {
    slug: 'restaurant-cafe',
    typeTokens: ['مطعم', 'مطاعم', 'مقهى', 'مقاهي', 'restaurant', 'cafe', 'coffee'],
    domainTokens: []
  },
  {
    slug: 'furniture-home',
    typeTokens: ['أثاث', 'اثاث', 'مفروشات', 'furniture'],
    domainTokens: []
  },
  {
    slug: 'hardware-tools',
    typeTokens: ['عدد', 'أدوات', 'hardware', 'tools'],
    domainTokens: []
  },
  {
    slug: 'general-retail',
    typeTokens: ['تجاري', 'retail'],
    domainTokens: []
  }
];

const storeSelect = {
  id: true,
  slug: true,
  nameAr: true,
  nameEn: true,
  bioAr: true,
  bioEn: true,
  logoUrl: true,
  coverUrl: true,
  phone: true,
  city: true,
  storeTypeId: true,
  rootCategory: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
  storeType: { select: { id: true, nameAr: true, nameEn: true, slug: true, icon: true } },
  _count: { select: { ads: { where: { deletedAt: null, isActive: true } } } }
} satisfies Prisma.StoreSelect;

type StoreRow = Prisma.StoreGetPayload<{ select: typeof storeSelect }>;

export type AssistantStoreSearchMeta = {
  items: StoreRow[];
  isFallback: boolean;
  primaryTokens: string[];
  browseQuery: string;
  storeTypeId?: string;
  storeTypeSlug?: string;
  city?: string;
};

function normalizeToken(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^ال(?=\p{L})/u, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim();
}

function tokenize(...sources: Array<string | undefined | null>): string[] {
  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!source?.trim()) continue;
    for (const part of source.split(/\s+/)) {
      const token = normalizeToken(part);
      if (token.length < 2 || seen.has(token)) continue;
      seen.add(token);
      tokens.push(token);
    }
  }

  return tokens;
}

export function extractCityFromMessage(...sources: Array<string | undefined | null>): string | undefined {
  for (const source of sources) {
    if (!source?.trim()) continue;
    for (const city of omanCities) {
      if (source.includes(city)) return city;
    }
    const lower = source.toLowerCase();
    for (const [alias, value] of Object.entries(CITY_ALIASES)) {
      if (lower.includes(alias)) return value;
    }
  }
  return undefined;
}

export function extractStoreSearchTokens(...sources: Array<string | undefined | null>): string[] {
  return tokenize(...sources).filter((token) => !STORE_STOP_WORDS.has(token) && !omanCities.includes(token as (typeof omanCities)[number]));
}

export function inferStoreTypeSlug(allTokens: string[]): string | undefined {
  let best: { slug: string; score: number } | undefined;

  for (const rule of STORE_TYPE_SLUG_HINTS) {
    const typeHits = rule.typeTokens.filter((token) => allTokens.includes(normalizeToken(token)));
    const domainHits = (rule.domainTokens ?? []).filter((token) => allTokens.includes(normalizeToken(token)));

    if (typeHits.length === 0) continue;

    let score = typeHits.length * 10 + domainHits.length * 5;
    if (domainHits.length > 0) score += 8;

    if (!best || score > best.score) {
      best = { slug: rule.slug, score };
    }
  }

  if (best) return best.slug;

  const domainOnly = allTokens.filter((token) =>
    ['سيارة', 'سيارات', 'car', 'cars', 'auto', 'vehicle', 'vehicles'].includes(token)
  );
  if (domainOnly.length > 0) return 'car-showroom';

  return undefined;
}

function publicStoreWhere(): Prisma.StoreWhereInput {
  const now = new Date();
  return {
    deletedAt: null,
    isActive: true,
    subscriptions: {
      some: {
        deletedAt: null,
        isActive: true,
        status: StoreSubscriptionStatus.ACTIVE,
        endsAt: { gt: now }
      }
    }
  };
}

function tokenMatchWhere(token: string): Prisma.StoreWhereInput {
  return {
    OR: [
      { nameAr: { contains: token, mode: 'insensitive' } },
      { nameEn: { contains: token, mode: 'insensitive' } },
      { bioAr: { contains: token, mode: 'insensitive' } },
      { bioEn: { contains: token, mode: 'insensitive' } },
      { storeType: { is: { nameAr: { contains: token, mode: 'insensitive' } } } },
      { storeType: { is: { nameEn: { contains: token, mode: 'insensitive' } } } }
    ]
  };
}

function buildStrictWhere(primaryTokens: string[]): Prisma.StoreWhereInput | null {
  if (primaryTokens.length === 0) return null;
  return { AND: primaryTokens.map((token) => tokenMatchWhere(token)) };
}

function buildLooseWhere(primaryTokens: string[]): Prisma.StoreWhereInput | null {
  if (primaryTokens.length === 0) return null;
  return { OR: primaryTokens.flatMap((token) => tokenMatchWhere(token).OR ?? []) };
}

function countPrimaryMatches(store: StoreRow, primaryTokens: string[]): { name: number; total: number } {
  const fields = [
    store.nameAr,
    store.nameEn,
    store.bioAr,
    store.bioEn,
    store.storeType?.nameAr ?? '',
    store.storeType?.nameEn ?? ''
  ].map((value) => value.toLowerCase());

  let nameMatches = 0;
  let totalMatches = 0;

  for (const token of primaryTokens) {
    const inName =
      store.nameAr.toLowerCase().includes(token) || store.nameEn.toLowerCase().includes(token);
    const inText = fields.some((field) => field.includes(token));
    if (inName) nameMatches += 1;
    if (inText) totalMatches += 1;
  }

  return { name: nameMatches, total: totalMatches };
}

function scoreStore(store: StoreRow, primaryTokens: string[], storeTypeSlug?: string): number {
  let score = 0;

  if (primaryTokens.length > 0) {
    const { name, total } = countPrimaryMatches(store, primaryTokens);
    if (total === 0) return -1;
    score += total * 100 + name * 150;
    if (total === primaryTokens.length) score += 200;
    if (name === primaryTokens.length) score += 300;
  }

  if (storeTypeSlug && store.storeType?.slug === storeTypeSlug) score += 250;
  score += Math.min(store._count.ads, 20);
  return score;
}

function rankStores(
  stores: StoreRow[],
  primaryTokens: string[],
  storeTypeSlug?: string,
  limit = ASSISTANT_STORES_LIMIT
) {
  return stores
    .map((store) => ({ store, score: scoreStore(store, primaryTokens, storeTypeSlug) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score || b.store._count.ads - a.store._count.ads)
    .slice(0, limit)
    .map((row) => row.store);
}

async function runQuery(where: Prisma.StoreWhereInput, take: number) {
  return prisma.store.findMany({
    where,
    select: storeSelect,
    take,
    orderBy: [{ createdAt: 'desc' }]
  });
}

async function resolveStoreTypeId(slug?: string): Promise<{ id?: string; slug?: string }> {
  if (!slug) return {};
  const storeType = await prisma.storeType.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    select: { id: true, slug: true }
  });
  return storeType ? { id: storeType.id, slug: storeType.slug } : { slug };
}

export async function searchStoresFlexible(
  args: SearchStoresToolArgs,
  userMessage?: string
): Promise<AssistantStoreSearchMeta> {
  const allTokens = tokenize(args.q, userMessage);
  const primaryTokens = extractStoreSearchTokens(args.q, userMessage);
  const city = args.city?.trim() || extractCityFromMessage(args.q, userMessage) || undefined;
  const storeTypeSlug = args.storeTypeSlug?.trim() || inferStoreTypeSlug(allTokens) || undefined;
  const { id: storeTypeId } = await resolveStoreTypeId(storeTypeSlug);

  const baseWhere: Prisma.StoreWhereInput = {
    AND: [
      publicStoreWhere(),
      ...(storeTypeId ? [{ storeTypeId }] : []),
      ...(city ? [{ city }] : [])
    ]
  };

  if (primaryTokens.length > 0) {
    let candidates = await runQuery({ AND: [...(Array.isArray(baseWhere.AND) ? baseWhere.AND : [baseWhere]), buildStrictWhere(primaryTokens)!] }, 40);

    if (candidates.length === 0 && primaryTokens.length > 1) {
      candidates = await runQuery(
        { AND: [...(Array.isArray(baseWhere.AND) ? baseWhere.AND : [baseWhere]), tokenMatchWhere(primaryTokens[0]!)] },
        40
      );
    }

    if (candidates.length === 0) {
      candidates = await runQuery({ AND: [...(Array.isArray(baseWhere.AND) ? baseWhere.AND : [baseWhere]), buildLooseWhere(primaryTokens)!] }, 40);
      const minMatches = Math.max(1, Math.ceil(primaryTokens.length / 2));
      candidates = candidates.filter((store) => countPrimaryMatches(store, primaryTokens).total >= minMatches);
    }

    if (candidates.length > 0) {
      const ranked = rankStores(candidates, primaryTokens, storeTypeSlug);
      if (ranked.length > 0) {
        return {
          items: ranked,
          isFallback: false,
          primaryTokens,
          browseQuery: refineBrowseQuery(primaryTokens),
          storeTypeId,
          storeTypeSlug,
          city
        };
      }
    }
  }

  if (storeTypeId || city) {
    const filtered = await runQuery(baseWhere, ASSISTANT_STORES_LIMIT);
    if (filtered.length > 0) {
      return {
        items: filtered,
        isFallback: false,
        primaryTokens,
        browseQuery: refineBrowseQuery(primaryTokens),
        storeTypeId,
        storeTypeSlug,
        city
      };
    }
  }

  const fallbackItems = await runQuery(publicStoreWhere(), ASSISTANT_STORES_LIMIT);
  return {
    items: fallbackItems,
    isFallback: true,
    primaryTokens,
    browseQuery: refineBrowseQuery(primaryTokens),
    storeTypeId,
    storeTypeSlug,
    city
  };
}
