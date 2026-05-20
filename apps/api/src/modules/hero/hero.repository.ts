import type { HeroSlidePlatform, Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import { heroSlideAdminSelect } from './hero-slide.mapper';

export class HeroRepository {
  listActive(platform: HeroSlidePlatform = 'WEB') {
    return prisma.heroSlide.findMany({
      where: { isActive: true, platform },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: heroSlideAdminSelect
    });
  }

  listAll(platform?: HeroSlidePlatform) {
    return prisma.heroSlide.findMany({
      where: platform ? { platform } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: heroSlideAdminSelect
    });
  }

  findById(id: string) {
    return prisma.heroSlide.findUnique({ where: { id }, select: heroSlideAdminSelect });
  }

  create(data: Prisma.HeroSlideCreateInput) {
    return prisma.heroSlide.create({ data, select: heroSlideAdminSelect });
  }

  update(id: string, data: Prisma.HeroSlideUpdateInput) {
    return prisma.heroSlide.update({ where: { id }, data, select: heroSlideAdminSelect });
  }

  delete(id: string) {
    return prisma.heroSlide.delete({ where: { id } });
  }

  getNextSortOrder() {
    return prisma.heroSlide
      .aggregate({ _max: { sortOrder: true } })
      .then((result) => (result._max.sortOrder ?? -1) + 1);
  }

  listActiveBanners() {
    return prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
  }

  listAllBanners() {
    return prisma.heroBanner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
  }

  findBannerById(id: string) {
    return prisma.heroBanner.findUnique({ where: { id } });
  }

  createBanner(data: Prisma.HeroBannerCreateInput) {
    return prisma.heroBanner.create({ data });
  }

  updateBanner(id: string, data: Prisma.HeroBannerUpdateInput) {
    return prisma.heroBanner.update({ where: { id }, data });
  }

  deleteBanner(id: string) {
    return prisma.heroBanner.delete({ where: { id } });
  }

  getNextBannerSortOrder() {
    return prisma.heroBanner
      .aggregate({ _max: { sortOrder: true } })
      .then((result) => (result._max.sortOrder ?? -1) + 1);
  }
}
