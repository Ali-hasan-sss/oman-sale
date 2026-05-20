import type { HeroSlide, HeroSlidePlatform } from '@prisma/client';
import { Prisma } from '@prisma/client';

export const heroSlideAdminSelect = Prisma.validator<Prisma.HeroSlideSelect>()({
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

export const mapSlideForAdmin = (slide: HeroSlide): HeroSlideAdminRecord => ({
  id: slide.id,
  sortOrder: slide.sortOrder,
  platform: slide.platform,
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
