import { Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import {
  inferCategorySlugFromResults,
  inferCategorySlugFromTokens,
  refineBrowseQuery
} from './assistant-browse';
import { extractCityFromMessage } from './assistant-store-search';
import type { SearchListingsToolArgs } from './assistant.types';

export const ASSISTANT_LISTINGS_LIMIT = 4;

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'in', 'on', 'with', 'or', 'and', 'i', 'want', 'need', 'looking', 'show', 'me', 'find',
  'any', 'some', 'please', 'about', 'offer', 'offers', 'listing', 'listings', 'product', 'products', 'item', 'items',
  'price', 'priced', 'between', 'from', 'to', 'under', 'over', 'around', 'omr', 'ريال', 'رع', 'ر', 'ع', 'عمان',
  'oman', 'sale', 'أريد', 'أبحث', 'عن', 'في', 'من', 'إلى', 'الى', 'مع', 'أو', 'و', 'هل', 'ما', 'هذا', 'هذه', 'اي',
  'أي', 'عرض', 'عروض', 'إعلان', 'إعلانات', 'منتج', 'منتجات', 'سعر', 'سعره', 'بين', 'حول', 'عند', 'لدي', 'لي',
  'سيارة', 'سيارات', 'car', 'cars', 'vehicle', 'vehicles', 'لديكم', 'لدينا', 'عندكم', 'عندنا', 'فرصة', 'فرص',
  'وظيفة', 'وظائف', 'توظيف', 'عمل', 'job', 'jobs', 'company', 'opportunity', 'opportunities', 'hiring', 'hire',
  'vacancy', 'vacancies', 'position', 'positions', 'role', 'roles', 'career', 'careers', 'work', 'opening',
  'openings', 'مطلوب', 'required', 'needed', 'available', 'your', 'our', 'have', 'باحث', 'باحثين', 'seeking',
  'seeker', 'seekers'
]);

/** Direct Arabic ↔ English equivalents only (no broad category expansion). */
const TOKEN_ALIASES: Record<string, string[]> = {
  لابتوب: ['laptop', 'laptops', 'macbook', 'notebook'],
  'لاب توب': ['laptop', 'laptops', 'macbook'],
  حاسوب: ['laptop', 'computer', 'pc', 'macbook'],
  كمبيوتر: ['computer', 'laptop', 'pc'],
  تويوتا: ['toyota'],
  كامري: ['camry'],
  نيسان: ['nissan'],
  باترول: ['patrol'],
  هوندا: ['honda'],
  مرسيدس: ['mercedes', 'benz'],
  bmw: ['bmw'],
  iphone: ['iphone', 'apple'],
  آيفون: ['iphone', 'apple'],
  جوال: ['mobile', 'phone', 'iphone', 'samsung'],
  موبايل: ['mobile', 'phone'],
  شقة: ['apartment', 'flat'],
  فيلا: ['villa'],
  عقار: ['property', 'apartment', 'villa'],
  وظيفة: ['job'],
  وظائف: ['jobs'],
  laptop: ['laptop', 'notebook', 'macbook'],
  camry: ['camry'],
  toyota: ['toyota'],
  مبرمج: ['programmer', 'developer', 'software', 'engineer', 'برمجيات'],
  programmer: ['programmer', 'developer', 'software'],
  developer: ['developer', 'programmer', 'software'],
  مهندس: ['engineer', 'developer', 'software']
};

const adInclude = {
  images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
  promotion: { include: { plan: true } },
  category: true,
  store: { select: { id: true, isActive: true, deletedAt: true } }
} satisfies Prisma.AdInclude;

type AdRow = Awaited<ReturnType<typeof prisma.ad.findMany<{ include: typeof adInclude }>>>[number];

export type AssistantSearchMeta = {
  items: AdRow[];
  isFallback: boolean;
  primaryTokens: string[];
  browseQuery: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
};

function finalizeSearchMeta(
  items: AdRow[],
  isFallback: boolean,
  primaryTokens: string[],
  categoryHintTokens: string[],
  minPrice?: number,
  maxPrice?: number,
  city?: string
): AssistantSearchMeta {
  const categorySlug =
    inferCategorySlugFromResults(items, categoryHintTokens) ?? inferCategorySlugFromTokens(categoryHintTokens);
  const browseQuery = refineBrowseQuery(primaryTokens.length > 0 ? primaryTokens : categoryHintTokens);

  return {
    items,
    isFallback,
    primaryTokens,
    browseQuery,
    categorySlug,
    minPrice,
    maxPrice,
    city
  };
}

function publicAdWhere(): Prisma.AdWhereInput {
  return {
    deletedAt: null,
    isActive: true,
    isSold: false,
    status: 'ACTIVE',
    isApproved: true,
    AND: [{ OR: [{ storeId: null }, { store: { is: { deletedAt: null, isActive: true } } }] }]
  };
}

function normalizeToken(raw: string) {
  return raw.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim();
}

/** User-facing keywords only — no alias expansion. */
export function extractPrimaryTokens(...sources: Array<string | undefined | null>): string[] {
  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!source?.trim()) continue;
    for (const part of source.split(/\s+/)) {
      const token = normalizeToken(part);
      if (token.length < 2 || STOP_WORDS.has(token) || seen.has(token)) continue;
      seen.add(token);
      tokens.push(token);
    }
  }

  return tokens;
}

function expandToken(token: string): string[] {
  const variants = new Set<string>([token]);
  for (const alias of TOKEN_ALIASES[token] ?? []) {
    variants.add(alias.toLowerCase());
  }
  return [...variants];
}

function tokenMatchWhere(token: string): Prisma.AdWhereInput {
  const variants = expandToken(token);
  return {
    OR: variants.flatMap((variant) => [
      { title: { contains: variant, mode: 'insensitive' } },
      { description: { contains: variant, mode: 'insensitive' } }
    ])
  };
}

function buildStrictWhere(primaryTokens: string[]): Prisma.AdWhereInput | null {
  if (primaryTokens.length === 0) return null;
  return { AND: primaryTokens.map((token) => tokenMatchWhere(token)) };
}

function buildLooseWhere(primaryTokens: string[]): Prisma.AdWhereInput | null {
  if (primaryTokens.length === 0) return null;
  const variants = primaryTokens.flatMap((token) => expandToken(token));
  return {
    OR: variants.flatMap((variant) => [
      { title: { contains: variant, mode: 'insensitive' } },
      { description: { contains: variant, mode: 'insensitive' } }
    ])
  };
}

function countPrimaryMatches(ad: AdRow, primaryTokens: string[]): { title: number; total: number } {
  const title = ad.title.toLowerCase();
  const description = ad.description.toLowerCase();
  let titleMatches = 0;
  let totalMatches = 0;

  for (const token of primaryTokens) {
    const variants = expandToken(token);
    const inTitle = variants.some((variant) => title.includes(variant));
    const inText = inTitle || variants.some((variant) => description.includes(variant));
    if (inTitle) titleMatches += 1;
    if (inText) totalMatches += 1;
  }

  return { title: titleMatches, total: totalMatches };
}

function priceScore(price: number | null, minPrice?: number, maxPrice?: number) {
  if (price === null || minPrice === undefined && maxPrice === undefined) return 0;

  if (minPrice !== undefined && maxPrice !== undefined) {
    if (price >= minPrice && price <= maxPrice) return 120;
    const center = (minPrice + maxPrice) / 2;
    return Math.max(0, 80 - Math.abs(price - center) / Math.max(center * 0.05, 1));
  }

  if (minPrice !== undefined) {
    if (price >= minPrice) return 80;
    return Math.max(0, 60 - (minPrice - price) / Math.max(minPrice * 0.05, 1));
  }

  if (maxPrice !== undefined) {
    if (price <= maxPrice) return 80;
    return Math.max(0, 60 - (price - maxPrice) / Math.max(maxPrice * 0.05, 1));
  }

  return 0;
}

function scoreAd(
  ad: AdRow,
  primaryTokens: string[],
  minPrice?: number,
  maxPrice?: number
): number {
  if (primaryTokens.length === 0) return ad.promotion ? 5 : 0;

  const { title, total } = countPrimaryMatches(ad, primaryTokens);
  if (total === 0) return -1;

  let score = total * 100 + title * 150;
  if (total === primaryTokens.length) score += 200;
  if (title === primaryTokens.length) score += 300;
  if (ad.promotion) score += 12;

  const numericPrice =
    ad.price === null || ad.price === undefined
      ? null
      : typeof ad.price === 'number'
        ? ad.price
        : Number(ad.price);

  score += priceScore(Number.isFinite(numericPrice) ? numericPrice : null, minPrice, maxPrice);
  return score;
}

function rankAds(
  ads: AdRow[],
  primaryTokens: string[],
  minPrice?: number,
  maxPrice?: number,
  limit = ASSISTANT_LISTINGS_LIMIT
) {
  return ads
    .map((ad) => ({ ad, score: scoreAd(ad, primaryTokens, minPrice, maxPrice) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score || b.ad.createdAt.getTime() - a.ad.createdAt.getTime())
    .slice(0, limit)
    .map((row) => row.ad);
}

async function runQuery(where: Prisma.AdWhereInput, take: number) {
  return prisma.ad.findMany({ where, include: adInclude, take, orderBy: [{ createdAt: 'desc' }] });
}

function withPrice(where: Prisma.AdWhereInput, minPrice?: number, maxPrice?: number): Prisma.AdWhereInput {
  if (minPrice === undefined && maxPrice === undefined) return where;
  return {
    ...where,
    price: {
      ...(minPrice !== undefined && { gte: minPrice }),
      ...(maxPrice !== undefined && { lte: maxPrice })
    }
  };
}

/** Lighter tokenization for category routing (keeps وظيفة، فرصة، etc.). */
export function extractCategoryHintTokens(...sources: Array<string | undefined | null>): string[] {
  const lightStop = new Set([
    'a', 'an', 'the', 'for', 'in', 'on', 'with', 'or', 'and', 'i', 'want', 'need', 'looking', 'show', 'me', 'find',
    'any', 'some', 'please', 'about', 'from', 'to', 'under', 'over', 'around', 'omr', 'ريال', 'رع', 'عمان', 'oman',
    'sale', 'أريد', 'أبحث', 'عن', 'في', 'من', 'إلى', 'الى', 'مع', 'أو', 'و', 'هل', 'ما', 'هذا', 'هذه', 'اي', 'أي',
    'عرض', 'عروض', 'إعلان', 'إعلانات', 'لديكم', 'لدينا', 'عندكم', 'عندنا', 'your', 'our', 'have', 'available'
  ]);
  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!source?.trim()) continue;
    for (const part of source.split(/\s+/)) {
      const token = normalizeToken(part);
      if (token.length < 2 || lightStop.has(token) || seen.has(token)) continue;
      seen.add(token);
      tokens.push(token);
    }
  }

  return tokens;
}

export async function searchListingsFlexible(
  args: SearchListingsToolArgs,
  userMessage?: string
): Promise<AssistantSearchMeta> {
  const primaryTokens = extractPrimaryTokens(args.q, userMessage);
  const categoryHintTokens = extractCategoryHintTokens(args.q, userMessage);
  const baseWhere = publicAdWhere();
  const minPrice = args.minPrice;
  const maxPrice = args.maxPrice;
  const city = args.city?.trim() || extractCityFromMessage(args.q, userMessage) || undefined;

  const baseWithCity: Prisma.AdWhereInput = city ? { ...baseWhere, city } : baseWhere;

  if (primaryTokens.length > 0) {
    const strictWhere = withPrice({ AND: [baseWithCity, buildStrictWhere(primaryTokens)!] }, minPrice, maxPrice);
    let candidates = await runQuery(strictWhere, 60);

    if (candidates.length === 0 && (minPrice !== undefined || maxPrice !== undefined)) {
      candidates = await runQuery({ AND: [baseWithCity, buildStrictWhere(primaryTokens)!] }, 60);
    }

    if (candidates.length === 0 && primaryTokens.length > 1) {
      const leadToken = primaryTokens[0]!;
      const firstTokenWhere = withPrice({ AND: [baseWithCity, tokenMatchWhere(leadToken)] }, minPrice, maxPrice);
      candidates = await runQuery(firstTokenWhere, 60);
    }

    if (candidates.length === 0) {
      const looseWhere = withPrice({ AND: [baseWithCity, buildLooseWhere(primaryTokens)!] }, minPrice, maxPrice);
      candidates = await runQuery(looseWhere, 60);
      const minMatches = Math.max(1, Math.ceil(primaryTokens.length / 2));
      candidates = candidates.filter((ad) => countPrimaryMatches(ad, primaryTokens).total >= minMatches);
    }

    if (candidates.length > 0) {
      const ranked = rankAds(candidates, primaryTokens, minPrice, maxPrice);
      if (ranked.length > 0) {
        return finalizeSearchMeta(ranked, false, primaryTokens, categoryHintTokens, minPrice, maxPrice, city);
      }
    }
  }

  const fallbackItems = await runQuery(baseWithCity, ASSISTANT_LISTINGS_LIMIT);
  return finalizeSearchMeta(fallbackItems, true, primaryTokens, categoryHintTokens, minPrice, maxPrice, city);
}
