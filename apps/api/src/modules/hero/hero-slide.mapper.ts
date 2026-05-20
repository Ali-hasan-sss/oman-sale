import type { HeroSlidePlatform, Prisma } from '@prisma/client';
import { Prisma as PrismaNs } from '@prisma/client';

export const heroSlideAdminSelect = PrismaNs.validator<Prisma.HeroSlideSelect>()({
  id: true,
  sortOrder: true,
  platform: true,
  imageUrl: true,
  titleAr: true,
  titleEn: true,
  subtitleAr: true,
  subtitleEn: true,
  buttonLabelAr: true,
  buttonLabelEn: true,
  buttonLink: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
});

export type HeroSlideAdminSelect = PrismaNs.HeroSlideGetPayload<{ select: typeof heroSlideAdminSelect }>;

export type HeroSlideAdminRecord = {
  id: string;
  sortOrder: number;
  platform: HeroSlidePlatform;
  imageUrl: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  buttonLabelAr: string;
  buttonLabelEn: string;
  buttonLink: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const mapSlideForAdmin = (slide: HeroSlideAdminSelect): HeroSlideAdminRecord => ({
  id: slide.id,
  sortOrder: slide.sortOrder,
  platform: slide.platform ?? 'WEB',
  imageUrl: slide.imageUrl,
  titleAr: slide.titleAr,
  titleEn: slide.titleEn,
  subtitleAr: slide.subtitleAr,
  subtitleEn: slide.subtitleEn,
  buttonLabelAr: slide.buttonLabelAr,
  buttonLabelEn: slide.buttonLabelEn,
  buttonLink: slide.buttonLink,
  isActive: slide.isActive,
  createdAt: slide.createdAt,
  updatedAt: slide.updatedAt
});

export const buildHeroSlideUpdateData = (input: {
  sortOrder?: number;
  platform?: HeroSlidePlatform;
  imageUrl?: string;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  buttonLabelAr?: string;
  buttonLabelEn?: string;
  buttonLink?: string;
  isActive?: boolean;
}): Prisma.HeroSlideUpdateInput => {
  const data: Prisma.HeroSlideUpdateInput = {};
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.platform !== undefined) data.platform = input.platform;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
  if (input.titleAr !== undefined) data.titleAr = input.titleAr;
  if (input.titleEn !== undefined) data.titleEn = input.titleEn;
  if (input.subtitleAr !== undefined) data.subtitleAr = input.subtitleAr;
  if (input.subtitleEn !== undefined) data.subtitleEn = input.subtitleEn;
  if (input.buttonLabelAr !== undefined) data.buttonLabelAr = input.buttonLabelAr;
  if (input.buttonLabelEn !== undefined) data.buttonLabelEn = input.buttonLabelEn;
  if (input.buttonLink !== undefined) data.buttonLink = input.buttonLink;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  return data;
};
