import type { Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';

export class HeroRepository {
  listActive() {
    return prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
  }

  listAll() {
    return prisma.heroSlide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
  }

  findById(id: string) {
    return prisma.heroSlide.findUnique({ where: { id } });
  }

  create(data: Prisma.HeroSlideCreateInput) {
    return prisma.heroSlide.create({ data });
  }

  update(id: string, data: Prisma.HeroSlideUpdateInput) {
    return prisma.heroSlide.update({ where: { id }, data });
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
